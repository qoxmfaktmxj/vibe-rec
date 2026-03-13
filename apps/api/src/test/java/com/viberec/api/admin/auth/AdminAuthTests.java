package com.viberec.api.admin.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.server.ResponseStatusException;

@SpringBootTest
class AdminAuthTests {

    @Autowired
    private AdminAccountRepository adminAccountRepository;

    @Autowired
    private AdminAuthService adminAuthService;

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
    }

    @Test
    void rejectsInvalidAdminPassword() {
        assertThatThrownBy(() -> adminAuthService.login(new AdminLoginRequest("admin", "wrong-password")))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid admin credentials.");
    }
}
