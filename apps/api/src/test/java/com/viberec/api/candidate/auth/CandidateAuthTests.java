package com.viberec.api.candidate.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateLoginRequest;
import com.viberec.api.candidate.auth.web.CandidatePasswordChangeRequest;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class CandidateAuthTests extends IntegrationTestBase {

    @Autowired
    private CandidateAuthService candidateAuthService;

    @Autowired
    private CandidateAccountRepository candidateAccountRepository;

    @Autowired
    private CandidateSessionRepository candidateSessionRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @BeforeEach
    void cleanCandidateAuth() {
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void signsUpAndResolvesCandidateSession() {
        var response = candidateAuthService.signup(
                new CandidateSignupRequest("Candidate Kim", "candidate@example.com", "010-1234-5678", "password123")
        );

        assertThat(response.email()).isEqualTo("candidate@example.com");
        assertThat(response.name()).isEqualTo("Candidate Kim");
        assertThat(response.sessionToken()).isNotBlank();
        assertThat(response.emailVerified()).isFalse();

        var session = candidateAuthService.getSession(response.sessionToken());
        assertThat(session.email()).isEqualTo("candidate@example.com");
        assertThat(session.phone()).isEqualTo("010-1234-5678");
        assertThat(session.emailVerified()).isFalse();
    }

    @Test
    void verifiesEmailWithOneTimeTokenAndRejectsReuseOrExpiry() {
        var signup = candidateAuthService.signup(
                new CandidateSignupRequest("Verify Kim", "verify@example.com", "010-1010-2020", "password123")
        );
        String verificationToken = latestCandidateAuthToken("verify@example.com");

        assertThat(candidateAccountRecoveryService.confirmEmail(verificationToken)).isTrue();
        assertThat(candidateAuthService.getSession(signup.sessionToken()).emailVerified()).isTrue();
        assertThatThrownBy(() -> candidateAccountRecoveryService.confirmEmail(verificationToken))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        var expiring = candidateAuthService.signup(
                new CandidateSignupRequest("Expired Kim", "expired@example.com", "010-2020-3030", "password123")
        );
        String expiredToken = latestCandidateAuthToken("expired@example.com");
        jdbcTemplate.update(
                "update platform.candidate_auth_token set expires_at = current_timestamp - interval '1 minute' where candidate_account_id = ?",
                expiring.candidateAccountId()
        );
        assertThatThrownBy(() -> candidateAccountRecoveryService.confirmEmail(expiredToken))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void resetsPasswordWithoutAccountEnumerationAndRevokesExistingSessions() {
        var signup = candidateAuthService.signup(
                new CandidateSignupRequest("Recovery Kim", "recovery@example.com", "010-3030-4040", "password123")
        );
        verifyCandidateEmail("recovery@example.com");
        var secondSession = candidateAuthService.login(
                new CandidateLoginRequest("recovery@example.com", "password123")
        );
        long outboxCount = candidateAuthMailOutboxRepository.count();

        candidateAccountRecoveryService.requestPasswordReset("missing@example.com");
        assertThat(candidateAuthMailOutboxRepository.count()).isEqualTo(outboxCount);

        candidateAccountRecoveryService.requestPasswordReset("recovery@example.com");
        String resetToken = latestCandidateAuthToken("recovery@example.com");
        var reset = candidateAuthService.resetPassword(resetToken, "new-password123", "Recovered browser");

        assertThat(reset.emailVerified()).isTrue();
        assertThatThrownBy(() -> candidateAuthService.getSession(signup.sessionToken()))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> candidateAuthService.getSession(secondSession.sessionToken()))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> candidateAuthService.login(
                new CandidateLoginRequest("recovery@example.com", "password123")
        )).isInstanceOf(ResponseStatusException.class);
        assertThat(candidateAuthService.login(
                new CandidateLoginRequest("recovery@example.com", "new-password123")
        ).sessionToken()).isNotBlank();
        assertThatThrownBy(() -> candidateAuthService.resetPassword(
                resetToken,
                "another-password123",
                "Reuse attempt"
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void logsInAndLogsOutCandidateAccount() {
        candidateAuthService.signup(new CandidateSignupRequest("Login Kim", "login@example.com", "010-2222-3333", "password123"));

        var login = candidateAuthService.login(new CandidateLoginRequest("login@example.com", "password123"));
        assertThat(login.sessionToken()).isNotBlank();

        candidateAuthService.logout(login.sessionToken());

        assertThatThrownBy(() -> candidateAuthService.getSession(login.sessionToken()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsInvalidCandidatePassword() {
        candidateAuthService.signup(new CandidateSignupRequest("Wrong Kim", "wrong@example.com", "010-4444-5555", "password123"));

        assertThatThrownBy(() -> candidateAuthService.login(new CandidateLoginRequest("wrong@example.com", "wrong-password")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void listsAndRevokesOnlyOwnedCandidateSessions() {
        var signup = candidateAuthService.signup(
                new CandidateSignupRequest("Session Kim", "sessions@example.com", "010-5555-6666", "password123"),
                "Signup browser"
        );
        var current = candidateAuthService.login(
                new CandidateLoginRequest("sessions@example.com", "password123"),
                "Current browser"
        );
        var otherAccount = candidateAuthService.signup(
                new CandidateSignupRequest("Other Kim", "other@example.com", "010-6666-7777", "password123"),
                "Other browser"
        );

        var sessions = candidateAuthService.getActiveSessions(current.sessionToken());
        assertThat(sessions).hasSize(2);
        assertThat(sessions).filteredOn(session -> session.current() && session.userAgent().equals("Current browser"))
                .hasSize(1);

        Long signupSessionId = sessions.stream()
                .filter(session -> session.userAgent().equals("Signup browser"))
                .findFirst()
                .orElseThrow()
                .id();
        candidateAuthService.revokeSession(current.sessionToken(), signupSessionId);

        assertThatThrownBy(() -> candidateAuthService.getSession(signup.sessionToken()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(candidateAuthService.getSession(current.sessionToken()).email()).isEqualTo("sessions@example.com");

        Long foreignSessionId = candidateAuthService.getActiveSessions(otherAccount.sessionToken()).getFirst().id();
        assertThatThrownBy(() -> candidateAuthService.revokeSession(current.sessionToken(), foreignSessionId))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(candidateAuthService.getSession(otherAccount.sessionToken()).email()).isEqualTo("other@example.com");
    }

    @Test
    void revokesAllOtherSessionsButKeepsCurrentSession() {
        var first = candidateAuthService.signup(
                new CandidateSignupRequest("Remote Kim", "remote@example.com", "010-7777-8888", "password123")
        );
        var current = candidateAuthService.login(new CandidateLoginRequest("remote@example.com", "password123"));

        candidateAuthService.revokeOtherSessions(current.sessionToken());

        assertThatThrownBy(() -> candidateAuthService.getSession(first.sessionToken()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(candidateAuthService.getActiveSessions(current.sessionToken()))
                .singleElement()
                .extracting(session -> session.current())
                .isEqualTo(true);
    }

    @Test
    void changesPasswordAndRotatesEveryExistingSession() {
        var first = candidateAuthService.signup(
                new CandidateSignupRequest("Secure Kim", "secure@example.com", "010-8888-9999", "password123")
        );
        var second = candidateAuthService.login(new CandidateLoginRequest("secure@example.com", "password123"));

        assertThatThrownBy(() -> candidateAuthService.changePassword(
                second.sessionToken(),
                new CandidatePasswordChangeRequest("incorrect", "new-password123"),
                "Secure browser"
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);

        var rotated = candidateAuthService.changePassword(
                second.sessionToken(),
                new CandidatePasswordChangeRequest("password123", "new-password123"),
                "Secure browser"
        );

        assertThatThrownBy(() -> candidateAuthService.getSession(first.sessionToken()))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> candidateAuthService.getSession(second.sessionToken()))
                .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> candidateAuthService.login(
                new CandidateLoginRequest("secure@example.com", "password123")
        )).isInstanceOf(ResponseStatusException.class);
        assertThat(candidateAuthService.getSession(rotated.sessionToken()).email()).isEqualTo("secure@example.com");
        assertThat(candidateAuthService.login(
                new CandidateLoginRequest("secure@example.com", "new-password123")
        ).sessionToken()).isNotBlank();
    }
}
