package com.viberec.api.admin.auth.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.domain.AdminRole;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import com.viberec.api.admin.auth.web.AdminLoginResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminAuthService {

    private final AdminAccountRepository adminAccountRepository;

    public AdminAuthService(AdminAccountRepository adminAccountRepository) {
        this.adminAccountRepository = adminAccountRepository;
    }

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        String normalizedUsername = normalizeUsername(request.username());
        AdminAccount account = adminAccountRepository.authenticate(normalizedUsername, request.password())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials."));

        adminAccountRepository.markAuthenticated(account.getId());

        return new AdminLoginResponse(
                account.getId(),
                account.getUsername(),
                account.getDisplayName(),
                account.getRole(),
                java.time.OffsetDateTime.now()
        );
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase();
    }
}

@Component
class DevAdminAccountBootstrap implements ApplicationRunner {

    private final AdminAccountRepository adminAccountRepository;
    private final boolean enabled;
    private final String username;
    private final String password;
    private final String displayName;
    private final AdminRole role;

    DevAdminAccountBootstrap(
            AdminAccountRepository adminAccountRepository,
            @Value("${app.admin.dev-account.enabled:true}") boolean enabled,
            @Value("${app.admin.dev-account.username:admin}") String username,
            @Value("${app.admin.dev-account.password:admin}") String password,
            @Value("${app.admin.dev-account.display-name:Dev Admin}") String displayName,
            @Value("${app.admin.dev-account.role:SUPER_ADMIN}") AdminRole role
    ) {
        this.adminAccountRepository = adminAccountRepository;
        this.enabled = enabled;
        this.username = username;
        this.password = password;
        this.displayName = displayName;
        this.role = role;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        adminAccountRepository.upsertDevAccount(
                username.trim().toLowerCase(),
                displayName.trim(),
                password,
                role.name()
        );
    }
}
