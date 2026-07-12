package com.viberec.api.platform.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.viberec.api.candidate.auth.web.CandidateLoginRequest;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;

@TestPropertySource(properties = "app.auth-rate-limit.signup.max-requests=10")
class AuthenticationRateLimitTests extends IntegrationTestBase {

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private AuthenticationRateLimitService authenticationRateLimitService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUpMockMvc() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    void blocksCandidateLoginAcrossRequestsAndRecoversAfterExpiry() {
        candidateAuthService.signup(new CandidateSignupRequest(
                "Rate Limited Candidate",
                "rate-limit@example.com",
                "010-4545-5656",
                "password123"
        ));

        for (int attempt = 0; attempt < 4; attempt++) {
            assertThatThrownBy(() -> candidateAuthService.login(
                    new CandidateLoginRequest("RATE-LIMIT@example.com", "wrong-password")
            )).isInstanceOf(ResponseStatusException.class);
        }
        assertThatThrownBy(() -> candidateAuthService.login(
                new CandidateLoginRequest("rate-limit@example.com", "wrong-password")
        )).isInstanceOf(AuthenticationRateLimitExceededException.class);
        assertThatThrownBy(() -> candidateAuthService.login(
                new CandidateLoginRequest("rate-limit@example.com", "password123")
        )).isInstanceOf(AuthenticationRateLimitExceededException.class);
        assertThat(candidateAuthService.login(
                new CandidateLoginRequest("rate-limit@example.com", "password123"),
                "Different network browser",
                "203.0.113.20"
        ).sessionToken()).isNotBlank();

        var storedLimit = jdbcTemplate.queryForMap("""
                select subject_hash, attempt_count, blocked_until
                from platform.authentication_rate_limit
                where scope = 'CANDIDATE_LOGIN'
                """);
        assertThat(storedLimit.get("subject_hash").toString())
                .matches("[0-9a-f]{64}")
                .doesNotContain("rate-limit@example.com");
        assertThat(storedLimit.get("attempt_count")).isEqualTo(5);
        assertThat(storedLimit.get("blocked_until")).isNotNull();

        jdbcTemplate.update("""
                update platform.authentication_rate_limit
                set blocked_until = current_timestamp - interval '1 second',
                    window_started_at = current_timestamp - interval '16 minutes'
                where scope = 'CANDIDATE_LOGIN'
                """);

        assertThat(candidateAuthService.login(
                new CandidateLoginRequest("rate-limit@example.com", "password123")
        ).sessionToken()).isNotBlank();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from platform.authentication_rate_limit where scope = 'CANDIDATE_LOGIN'",
                Long.class
        )).isZero();
    }

    @Test
    void limitsSignupVolumePerClientNetwork() {
        authenticationRateLimitService.consumeSignupRequest("198.51.100.40");
        for (int request = 1; request < 10; request++) {
            authenticationRateLimitService.consumeSignupRequest("198.51.100.40");
        }

        assertThatThrownBy(() -> authenticationRateLimitService.consumeSignupRequest("198.51.100.40"))
                .isInstanceOf(AuthenticationRateLimitExceededException.class);
        authenticationRateLimitService.consumeSignupRequest("198.51.100.41");
    }

    @Test
    void limitsPasswordResetWithoutRevealingWhetherAccountExists() {
        long outboxCount = candidateAuthMailOutboxRepository.count();

        for (int request = 0; request < 3; request++) {
            candidateAccountRecoveryService.requestPasswordReset("missing-rate-limit@example.com");
        }
        assertThatThrownBy(() -> candidateAccountRecoveryService.requestPasswordReset(
                "missing-rate-limit@example.com"
        )).isInstanceOf(AuthenticationRateLimitExceededException.class);

        assertThat(candidateAuthMailOutboxRepository.count()).isEqualTo(outboxCount);
        assertThat(jdbcTemplate.queryForObject("""
                select attempt_count
                from platform.authentication_rate_limit
                where scope = 'CANDIDATE_PASSWORD_RESET'
                """, Integer.class)).isEqualTo(4);

        jdbcTemplate.update("""
                update platform.authentication_rate_limit
                set blocked_until = current_timestamp - interval '2 hours',
                    updated_at = current_timestamp - interval '2 hours'
                where scope = 'CANDIDATE_PASSWORD_RESET'
                """);
        authenticationRateLimitService.deleteExpiredLimits();
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from platform.authentication_rate_limit where scope = 'CANDIDATE_PASSWORD_RESET'",
                Long.class
        )).isZero();
    }

    @Test
    void returnsStandardRateLimitResponseForAdminLogin() throws Exception {
        String body = """
                {"username":"admin","password":"wrong-password"}
                """;
        for (int attempt = 0; attempt < 4; attempt++) {
            mockMvc.perform(post("/api/admin/auth/login")
                            .contextPath("/api")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(body))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/admin/auth/login")
                        .contextPath("/api")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", org.hamcrest.Matchers.matchesPattern("[1-9][0-9]*")))
                .andExpect(jsonPath("$.code").value("AUTH_RATE_LIMITED"))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }
}
