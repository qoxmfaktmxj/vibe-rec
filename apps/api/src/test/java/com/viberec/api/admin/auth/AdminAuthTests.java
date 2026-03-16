package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.auth.repository.AdminSessionRepository;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import com.viberec.api.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.server.ResponseStatusException;

class AdminAuthTests extends IntegrationTestBase {

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private AdminAuthService adminAuthService;

    @Autowired
    private AdminSessionRepository adminSessionRepository;

    @BeforeEach
    void cleanSessions() {
        adminSessionRepository.deleteAll();
    }

    @Test
    void bootstrapsDevelopmentAdminAccount() {
        var adminAccount = adminAccountRepository.findByUsernameIgnoreCase("admin");

        assertThat(adminAccount)
                .isPresent()
                .get()
                .extracting("username", "displayName")
                .containsExactly("admin", "Dev Admin");
    }

    @Test
    void authenticatesDevelopmentAdminAccount() {
        var response = adminAuthService.login(new AdminLoginRequest("admin", "admin"));

        assertThat(response.username()).isEqualTo("admin");
        assertThat(response.displayName()).isEqualTo("Dev Admin");
        assertThat(response.role().name()).isEqualTo("SUPER_ADMIN");
        assertThat(response.authenticatedAt()).isNotNull();
        assertThat(response.expiresAt()).isAfter(response.authenticatedAt());
        assertThat(response.sessionToken()).isNotBlank();
    }

    @Test
    void resolvesAndInvalidatesAdminSession() {
        var loginResponse = adminAuthService.login(new AdminLoginRequest("admin", "admin"));

        var sessionResponse = adminAuthService.getSession(loginResponse.sessionToken());

        assertThat(sessionResponse.username()).isEqualTo("admin");
        assertThat(sessionResponse.expiresAt()).isAfter(sessionResponse.authenticatedAt());

        adminAuthService.logout(loginResponse.sessionToken());

        assertThatThrownBy(() -> adminAuthService.getSession(loginResponse.sessionToken()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Admin session is missing or expired.");
    }

    @Test
    void rejectsInvalidAdminPassword() {
        assertThatThrownBy(() -> adminAuthService.login(new AdminLoginRequest("admin", "wrong-password")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid admin credentials.");
    }
}
