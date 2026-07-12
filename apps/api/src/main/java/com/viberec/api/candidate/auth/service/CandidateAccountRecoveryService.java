package com.viberec.api.candidate.auth.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailOutbox;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailDeliveryStatus;
import com.viberec.api.candidate.auth.domain.CandidateAuthToken;
import com.viberec.api.candidate.auth.domain.CandidateAuthTokenPurpose;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateAuthMailOutboxRepository;
import com.viberec.api.candidate.auth.repository.CandidateAuthTokenRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateAccountRecoveryService {

    private final CandidateAccountRepository candidateAccountRepository;
    private final CandidateSessionRepository candidateSessionRepository;
    private final CandidateAuthTokenRepository tokenRepository;
    private final CandidateAuthMailOutboxRepository mailOutboxRepository;
    private final AuthenticationRateLimitService authenticationRateLimitService;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String webBaseUrl;
    private final long verificationExpiryHours;
    private final long passwordResetExpiryMinutes;

    public CandidateAccountRecoveryService(
            CandidateAccountRepository candidateAccountRepository,
            CandidateSessionRepository candidateSessionRepository,
            CandidateAuthTokenRepository tokenRepository,
            CandidateAuthMailOutboxRepository mailOutboxRepository,
            AuthenticationRateLimitService authenticationRateLimitService,
            @Value("${app.web-base-url:http://localhost:3000}") String webBaseUrl,
            @Value("${app.candidate.email-verification.expiry-hours:24}") long verificationExpiryHours,
            @Value("${app.candidate.password-reset.expiry-minutes:30}") long passwordResetExpiryMinutes
    ) {
        this.candidateAccountRepository = candidateAccountRepository;
        this.candidateSessionRepository = candidateSessionRepository;
        this.tokenRepository = tokenRepository;
        this.mailOutboxRepository = mailOutboxRepository;
        this.authenticationRateLimitService = authenticationRateLimitService;
        this.webBaseUrl = webBaseUrl.replaceAll("/+$", "");
        this.verificationExpiryHours = verificationExpiryHours;
        this.passwordResetExpiryMinutes = passwordResetExpiryMinutes;
    }

    @Transactional
    public void issueEmailVerification(CandidateAccount account) {
        if (account.isEmailVerified()) {
            return;
        }
        authenticationRateLimitService.consumeMailRequest(
                AuthenticationRateLimitScope.CANDIDATE_EMAIL_VERIFICATION,
                account.getEmail().trim().toLowerCase()
        );
        supersedePendingMail(account, CandidateAuthTokenPurpose.EMAIL_VERIFICATION);
        String token = issueToken(
                account,
                CandidateAuthTokenPurpose.EMAIL_VERIFICATION,
                OffsetDateTime.now().plusHours(verificationExpiryHours)
        );
        String link = webBaseUrl + "/auth/verify-email?token=" + token;
        mailOutboxRepository.save(new CandidateAuthMailOutbox(
                account,
                CandidateAuthTokenPurpose.EMAIL_VERIFICATION,
                account.getEmail(),
                "[HireFlow] 이메일 주소를 확인해 주세요",
                "안녕하세요, " + account.getDisplayName() + "님.\n\n아래 링크에서 이메일 주소를 확인해 주세요.\n"
                        + link + "\n\n이 링크는 " + verificationExpiryHours + "시간 동안 한 번만 사용할 수 있습니다."
        ));
    }

    @Transactional
    public boolean confirmEmail(String rawToken) {
        CandidateAuthToken token = consumeToken(rawToken, CandidateAuthTokenPurpose.EMAIL_VERIFICATION);
        CandidateAccount account = token.getCandidateAccount();
        account.markEmailVerified(OffsetDateTime.now());
        return true;
    }

    @Transactional
    public void requestPasswordReset(String email) {
        requestPasswordReset(email, null);
    }

    @Transactional
    public void requestPasswordReset(String email, String clientNetwork) {
        String normalizedEmail = email == null ? "" : email.trim().toLowerCase();
        authenticationRateLimitService.consumePasswordResetRequest(
                clientNetwork,
                normalizedEmail
        );
        candidateAccountRepository.findByNormalizedEmail(normalizedEmail)
                .filter(CandidateAccount::isActive)
                .ifPresent(account -> {
                    supersedePendingMail(account, CandidateAuthTokenPurpose.PASSWORD_RESET);
                    String token = issueToken(
                            account,
                            CandidateAuthTokenPurpose.PASSWORD_RESET,
                            OffsetDateTime.now().plusMinutes(passwordResetExpiryMinutes)
                    );
                    String link = webBaseUrl + "/auth/reset-password?token=" + token;
                    mailOutboxRepository.save(new CandidateAuthMailOutbox(
                            account,
                            CandidateAuthTokenPurpose.PASSWORD_RESET,
                            account.getEmail(),
                            "[HireFlow] 비밀번호 재설정 안내",
                            "안녕하세요, " + account.getDisplayName() + "님.\n\n아래 링크에서 비밀번호를 재설정해 주세요.\n"
                                    + link + "\n\n이 링크는 " + passwordResetExpiryMinutes
                                    + "분 동안 한 번만 사용할 수 있습니다. 요청하지 않았다면 이 메일을 무시해 주세요."
                    ));
                });
    }

    private void supersedePendingMail(CandidateAccount account, CandidateAuthTokenPurpose purpose) {
        mailOutboxRepository.supersedeActive(
                account.getId(),
                purpose,
                List.of(
                        CandidateAuthMailDeliveryStatus.PENDING,
                        CandidateAuthMailDeliveryStatus.FAILED
                ),
                CandidateAuthMailDeliveryStatus.FAILED,
                OffsetDateTime.now()
        );
    }

    @Transactional
    public CandidateAccount resetPassword(String rawToken, String newPassword) {
        CandidateAuthToken token = consumeToken(rawToken, CandidateAuthTokenPurpose.PASSWORD_RESET);
        CandidateAccount account = token.getCandidateAccount();
        if (candidateAccountRepository.passwordMatches(account.getId(), newPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password must differ from the current password.");
        }
        account.markEmailVerified(OffsetDateTime.now());
        candidateAccountRepository.updatePassword(account.getId(), newPassword);
        candidateSessionRepository.invalidateAllSessions(account.getId(), OffsetDateTime.now());
        return account;
    }

    private String issueToken(
            CandidateAccount account,
            CandidateAuthTokenPurpose purpose,
            OffsetDateTime expiresAt
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        tokenRepository.invalidateActive(account.getId(), purpose, now);
        String rawToken = generateToken();
        tokenRepository.save(new CandidateAuthToken(account, purpose, hashToken(rawToken), expiresAt));
        return rawToken;
    }

    private CandidateAuthToken consumeToken(String rawToken, CandidateAuthTokenPurpose purpose) {
        String normalized = rawToken == null ? "" : rawToken.trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Authentication token is required.");
        }
        OffsetDateTime now = OffsetDateTime.now();
        CandidateAuthToken token = tokenRepository.findActive(hashToken(normalized), purpose, now)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Authentication token is invalid, expired, or already used."
                ));
        token.markUsed(now);
        tokenRepository.invalidateActive(token.getCandidateAccount().getId(), purpose, now);
        return token;
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 hashing is unavailable.", exception);
        }
    }
}
