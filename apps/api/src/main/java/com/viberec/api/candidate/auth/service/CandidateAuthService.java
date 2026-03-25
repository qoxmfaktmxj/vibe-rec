package com.viberec.api.candidate.auth.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.domain.CandidateSession;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.web.CandidateLoginRequest;
import com.viberec.api.candidate.auth.web.CandidateLoginResponse;
import com.viberec.api.candidate.auth.web.CandidateSessionResponse;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;
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
    private final SecureRandom secureRandom = new SecureRandom();
    private final long sessionDurationHours;

    public CandidateAuthService(
            CandidateAccountRepository candidateAccountRepository,
            CandidateSessionRepository candidateSessionRepository,
            @Value("${app.candidate.session.duration-hours:12}") long sessionDurationHours
    ) {
        this.candidateAccountRepository = candidateAccountRepository;
        this.candidateSessionRepository = candidateSessionRepository;
        this.sessionDurationHours = sessionDurationHours;
    }

    @Transactional
    public CandidateLoginResponse signup(CandidateSignupRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        if (candidateAccountRepository.findByNormalizedEmail(normalizedEmail).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Candidate email is already registered.");
        }

        candidateAccountRepository.createAccount(
                request.email().trim(),
                normalizedEmail,
                normalizeName(request.name()),
                normalizePhone(request.phone()),
                request.password()
        );

        return login(new CandidateLoginRequest(request.email(), request.password()));
    }

    @Transactional
    public CandidateLoginResponse login(CandidateLoginRequest request) {
        String normalizedEmail = normalizeEmail(request.email());
        CandidateAccount account = candidateAccountRepository.authenticate(normalizedEmail, request.password())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Candidate email or password is invalid."));

        candidateAccountRepository.markAuthenticated(account.getId());
        OffsetDateTime authenticatedAt = OffsetDateTime.now();
        OffsetDateTime expiresAt = authenticatedAt.plusHours(sessionDurationHours);
        String sessionToken = generateSessionToken();
        candidateSessionRepository.save(new CandidateSession(account, hashSessionToken(sessionToken), expiresAt));

        return new CandidateLoginResponse(
                account.getId(),
                account.getEmail(),
                account.getDisplayName(),
                account.getPhone(),
                authenticatedAt,
                expiresAt,
                sessionToken
        );
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
                session.getExpiresAt()
        );
    }

    @Transactional
    public void logout(String sessionToken) {
        candidateSessionRepository.invalidateByTokenHash(hashSessionToken(normalizeSessionToken(sessionToken)), OffsetDateTime.now());
    }

    public CandidateAccount requireActiveAccount(String sessionToken) {
        CandidateAccount account = findActiveSession(sessionToken).getCandidateAccount();
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Candidate session is not active.");
        }
        return account;
    }

    private CandidateSession findActiveSession(String sessionToken) {
        String normalizedToken = normalizeSessionToken(sessionToken);
        return candidateSessionRepository.findActiveSessionByTokenHash(hashSessionToken(normalizedToken), OffsetDateTime.now())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Candidate session is invalid or expired."));
    }

    private String normalizeEmail(String email) {
        String normalized = email == null ? "" : email.trim().toLowerCase();
        if (normalized.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        }
        return normalized;
    }

    private String normalizeName(String name) {
        String normalized = name == null ? "" : name.trim();
        if (normalized.length() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Name must be at least 2 characters.");
        }
        return normalized;
    }

    private String normalizePhone(String phone) {
        String normalized = phone == null ? "" : phone.trim();
        if (!normalized.matches("^[0-9+\\-() ]{8,40}$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number format is invalid.");
        }
        return normalized;
    }

    private String normalizeSessionToken(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Candidate session is invalid or expired.");
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
