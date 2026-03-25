package com.viberec.api.admin.auth.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.domain.AdminRole;
import com.viberec.api.admin.auth.domain.AdminSession;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.auth.repository.AdminSessionRepository;
import com.viberec.api.admin.auth.web.AdminLoginRequest;
import com.viberec.api.admin.auth.web.AdminLoginResponse;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.auth.web.AdminSignupRequest;
import com.viberec.api.platform.permission.service.PermissionService;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Objects;
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
    private final AdminSessionRepository adminSessionRepository;
    private final PermissionService permissionService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long sessionDurationHours;

    public AdminAuthService(
            AdminAccountRepository adminAccountRepository,
            AdminSessionRepository adminSessionRepository,
            PermissionService permissionService,
            @Value("${app.admin.session.duration-hours:12}") long sessionDurationHours
    ) {
        this.adminAccountRepository = adminAccountRepository;
        this.adminSessionRepository = adminSessionRepository;
        this.permissionService = permissionService;
        this.sessionDurationHours = sessionDurationHours;
    }

    @Transactional
    public AdminLoginResponse signup(AdminSignupRequest request) {
        String normalizedUsername = normalizeUsername(request.username());
        if (adminAccountRepository.findByUsernameIgnoreCase(normalizedUsername).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin username is already registered.");
        }

        adminAccountRepository.createAccount(
                normalizedUsername,
                normalizeDisplayName(request.displayName()),
                request.password()
        );

        return login(new AdminLoginRequest(request.username(), request.password()));
    }

    @Transactional
    public AdminLoginResponse login(AdminLoginRequest request) {
        String normalizedUsername = normalizeUsername(request.username());
        AdminAccount account = adminAccountRepository.authenticate(normalizedUsername, request.password())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin username or password is invalid."));

        adminAccountRepository.markAuthenticated(account.getId());
        OffsetDateTime authenticatedAt = OffsetDateTime.now();
        OffsetDateTime expiresAt = authenticatedAt.plusHours(sessionDurationHours);
        String sessionToken = generateSessionToken();

        adminSessionRepository.save(new AdminSession(account, hashSessionToken(sessionToken), expiresAt));
        List<String> permissions = permissionService.getPermissionCodes(account.getRole().name());

        return new AdminLoginResponse(
                account.getId(),
                account.getUsername(),
                account.getDisplayName(),
                account.getRole(),
                authenticatedAt,
                expiresAt,
                sessionToken,
                permissions
        );
    }

    @Transactional
    public AdminSessionResponse getSession(String sessionToken) {
        AdminSession session = findActiveSession(sessionToken);
        OffsetDateTime now = OffsetDateTime.now();
        adminSessionRepository.touch(session.getId(), now);
        List<String> permissions = permissionService.getPermissionCodes(session.getAdminAccount().getRole().name());

        return new AdminSessionResponse(
                session.getAdminAccount().getId(),
                session.getAdminAccount().getUsername(),
                session.getAdminAccount().getDisplayName(),
                session.getAdminAccount().getRole(),
                Objects.requireNonNullElse(session.getAdminAccount().getLastAuthenticatedAt(), now),
                session.getExpiresAt(),
                permissions
        );
    }

    @Transactional
    public void logout(String sessionToken) {
        String normalizedToken = normalizeSessionToken(sessionToken);
        adminSessionRepository.invalidateByTokenHash(hashSessionToken(normalizedToken), OffsetDateTime.now());
    }

    private String normalizeUsername(String username) {
        String normalized = username == null ? "" : username.trim().toLowerCase();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required.");
        }
        return normalized;
    }

    private String normalizeDisplayName(String displayName) {
        String normalized = displayName == null ? "" : displayName.trim();
        if (normalized.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Display name must be at least 2 characters.");
        }
        return normalized;
    }

    private AdminSession findActiveSession(String sessionToken) {
        String normalizedToken = normalizeSessionToken(sessionToken);
        return adminSessionRepository.findActiveSessionByTokenHash(hashSessionToken(normalizedToken), OffsetDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin session is invalid or expired."));
    }

    private String normalizeSessionToken(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin session is invalid or expired.");
        }
        return sessionToken.trim();
    }

    private String generateSessionToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashSessionToken(String sessionToken) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            byte[] digest = messageDigest.digest(sessionToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 hashing is unavailable.", exception);
        }
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
