package com.viberec.api.candidate.auth.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.domain.CandidateSession;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.web.CandidateAccountSessionResponse;
import com.viberec.api.candidate.auth.web.CandidateLoginRequest;
import com.viberec.api.candidate.auth.web.CandidateLoginResponse;
import com.viberec.api.candidate.auth.web.CandidatePasswordChangeRequest;
import com.viberec.api.candidate.auth.web.CandidateSessionResponse;
import com.viberec.api.candidate.auth.web.CandidateSessionRevocationResponse;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.platform.security.AuthenticationRateLimitScope;
import com.viberec.api.platform.security.AuthenticationRateLimitService;
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
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateAuthService {

    private final CandidateAccountRepository candidateAccountRepository;
    private final CandidateSessionRepository candidateSessionRepository;
    private final CandidateAccountRecoveryService candidateAccountRecoveryService;
    private final AuthenticationRateLimitService authenticationRateLimitService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final long sessionDurationHours;

    public CandidateAuthService(
            CandidateAccountRepository candidateAccountRepository,
            CandidateSessionRepository candidateSessionRepository,
            CandidateAccountRecoveryService candidateAccountRecoveryService,
            AuthenticationRateLimitService authenticationRateLimitService,
            @Value("${app.candidate.session.duration-hours:12}") long sessionDurationHours
    ) {
        this.candidateAccountRepository = candidateAccountRepository;
        this.candidateSessionRepository = candidateSessionRepository;
        this.candidateAccountRecoveryService = candidateAccountRecoveryService;
        this.authenticationRateLimitService = authenticationRateLimitService;
        this.sessionDurationHours = sessionDurationHours;
    }

    @Transactional
    public CandidateLoginResponse signup(CandidateSignupRequest request) {
        return signup(request, null, null);
    }

    @Transactional
    public CandidateLoginResponse signup(CandidateSignupRequest request, String userAgent) {
        return signup(request, userAgent, null);
    }

    @Transactional
    public CandidateLoginResponse signup(
            CandidateSignupRequest request,
            String userAgent,
            String clientNetwork
    ) {
        authenticationRateLimitService.consumeSignupRequest(clientNetwork);
        String normalizedEmail = normalizeEmail(request.email());
        if (candidateAccountRepository.findByNormalizedEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 등록된 이메일입니다.");
        }

        candidateAccountRepository.createAccount(
                request.email().trim(),
                normalizedEmail,
                normalizeName(request.name()),
                normalizePhone(request.phone()),
                request.password()
        );

        CandidateAccount account = candidateAccountRepository.findByNormalizedEmail(normalizedEmail)
                .orElseThrow(() -> new IllegalStateException("Created candidate account was not found."));
        candidateAccountRecoveryService.issueEmailVerification(account);
        candidateAccountRepository.markAuthenticated(account.getId());
        authenticationRateLimitService.clearLoginFailures(
                AuthenticationRateLimitScope.CANDIDATE_LOGIN,
                clientNetwork,
                normalizedEmail
        );
        return createSession(account, userAgent);
    }

    @Transactional
    public CandidateLoginResponse login(CandidateLoginRequest request) {
        return login(request, null, null);
    }

    @Transactional
    public CandidateLoginResponse login(CandidateLoginRequest request, String userAgent) {
        return login(request, userAgent, null);
    }

    @Transactional
    public CandidateLoginResponse login(
            CandidateLoginRequest request,
            String userAgent,
            String clientNetwork
    ) {
        String normalizedEmail = normalizeEmail(request.email());
        authenticationRateLimitService.assertLoginAllowed(
                AuthenticationRateLimitScope.CANDIDATE_LOGIN,
                clientNetwork,
                normalizedEmail
        );
        CandidateAccount account = candidateAccountRepository.authenticate(normalizedEmail, request.password())
                .orElse(null);
        if (account == null) {
            authenticationRateLimitService.recordLoginFailure(
                    AuthenticationRateLimitScope.CANDIDATE_LOGIN,
                    clientNetwork,
                    normalizedEmail
            );
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        authenticationRateLimitService.clearLoginFailures(
                AuthenticationRateLimitScope.CANDIDATE_LOGIN,
                clientNetwork,
                normalizedEmail
        );

        candidateAccountRepository.markAuthenticated(account.getId());
        return createSession(account, userAgent);
    }

    @Transactional
    public CandidateSessionResponse getSession(String sessionToken) {
        CandidateSession session = findActiveSession(sessionToken);
        OffsetDateTime now = OffsetDateTime.now();
        candidateSessionRepository.touch(session.getId(), now);
        CandidateAccount account = session.getCandidateAccount();

        return new CandidateSessionResponse(
                account.getId(),
                account.getEmail(),
                account.getDisplayName(),
                account.getPhone(),
                Objects.requireNonNullElse(account.getLastAuthenticatedAt(), now),
                session.getExpiresAt(),
                account.isEmailVerified()
        );
    }

    @Transactional
    public void logout(String sessionToken) {
        candidateSessionRepository.invalidateByTokenHash(
                hashSessionToken(normalizeSessionToken(sessionToken)),
                OffsetDateTime.now()
        );
    }

    @Transactional
    public List<CandidateAccountSessionResponse> getActiveSessions(String sessionToken) {
        CandidateSession currentSession = findActiveSession(sessionToken);
        OffsetDateTime now = OffsetDateTime.now();
        candidateSessionRepository.touch(currentSession.getId(), now);
        return candidateSessionRepository.findActiveSessions(currentSession.getCandidateAccount().getId(), now).stream()
                .map(session -> new CandidateAccountSessionResponse(
                        session.getId(),
                        session.getId().equals(currentSession.getId()),
                        Objects.requireNonNullElse(session.getUserAgent(), "Unknown"),
                        Objects.requireNonNullElse(session.getLastSeenAt(), session.getCreatedAt()),
                        session.getCreatedAt(),
                        session.getExpiresAt()
                ))
                .toList();
    }

    @Transactional
    public CandidateSessionRevocationResponse revokeSession(String sessionToken, Long sessionId) {
        CandidateSession currentSession = findActiveSession(sessionToken);
        int revoked = candidateSessionRepository.invalidateOwnedSession(
                currentSession.getCandidateAccount().getId(),
                sessionId,
                OffsetDateTime.now()
        );
        if (revoked == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "활성 세션을 찾을 수 없습니다.");
        }
        return new CandidateSessionRevocationResponse(currentSession.getId().equals(sessionId));
    }

    @Transactional
    public void revokeOtherSessions(String sessionToken) {
        CandidateSession currentSession = findActiveSession(sessionToken);
        candidateSessionRepository.invalidateOtherSessions(
                currentSession.getCandidateAccount().getId(),
                currentSession.getId(),
                OffsetDateTime.now()
        );
    }

    @Transactional
    public CandidateLoginResponse changePassword(
            String sessionToken,
            CandidatePasswordChangeRequest request,
            String userAgent
    ) {
        CandidateSession currentSession = findActiveSession(sessionToken);
        CandidateAccount account = currentSession.getCandidateAccount();
        if (!candidateAccountRepository.passwordMatches(account.getId(), request.currentPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "현재 비밀번호가 올바르지 않습니다.");
        }
        if (candidateAccountRepository.passwordMatches(account.getId(), request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "새 비밀번호는 현재 비밀번호와 달라야 합니다.");
        }

        candidateAccountRepository.updatePassword(account.getId(), request.newPassword());
        candidateSessionRepository.invalidateAllSessions(account.getId(), OffsetDateTime.now());
        return createSession(account, userAgent);
    }

    @Transactional
    public CandidateLoginResponse resetPassword(
            String token,
            String newPassword,
            String userAgent
    ) {
        CandidateAccount account = candidateAccountRecoveryService.resetPassword(token, newPassword);
        return createSession(account, userAgent);
    }

    public CandidateAccount requireActiveAccount(String sessionToken) {
        CandidateAccount account = findActiveSession(sessionToken).getCandidateAccount();
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "지원자 세션이 비활성화되었습니다.");
        }
        return account;
    }

    private CandidateSession findActiveSession(String sessionToken) {
        String normalizedToken = normalizeSessionToken(sessionToken);
        return candidateSessionRepository.findActiveSessionByTokenHash(hashSessionToken(normalizedToken), OffsetDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "지원자 세션이 없거나 만료되었습니다."));
    }

    private CandidateLoginResponse createSession(CandidateAccount account, String userAgent) {
        OffsetDateTime authenticatedAt = OffsetDateTime.now();
        OffsetDateTime expiresAt = authenticatedAt.plusHours(sessionDurationHours);
        String sessionToken = generateSessionToken();
        candidateSessionRepository.save(new CandidateSession(
                account,
                hashSessionToken(sessionToken),
                expiresAt,
                normalizeUserAgent(userAgent)
        ));

        return new CandidateLoginResponse(
                account.getId(),
                account.getEmail(),
                account.getDisplayName(),
                account.getPhone(),
                authenticatedAt,
                expiresAt,
                sessionToken,
                account.isEmailVerified()
        );
    }

    private String normalizeEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이메일을 입력해 주세요.");
        }
        return normalized;
    }

    private String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이름은 2자 이상이어야 합니다.");
        }
        return normalized;
    }

    private String normalizePhone(String phone) {
        String normalized = phone == null ? "" : phone.trim();
        if (!normalized.matches("^[0-9+\\-() ]{8,40}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "휴대전화 번호 형식이 올바르지 않습니다.");
        }
        return normalized;
    }

    private String normalizeSessionToken(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "지원자 세션이 없거나 만료되었습니다.");
        }
        return sessionToken.trim();
    }

    private String normalizeUserAgent(String userAgent) {
        if (userAgent == null || userAgent.isBlank()) {
            return "Unknown";
        }
        String normalized = userAgent.trim();
        return normalized.substring(0, Math.min(normalized.length(), 512));
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
