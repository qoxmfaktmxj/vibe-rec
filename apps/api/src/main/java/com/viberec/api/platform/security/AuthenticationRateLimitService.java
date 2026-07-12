package com.viberec.api.platform.security;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationRateLimitService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String INCREMENT_SQL = """
            insert into platform.authentication_rate_limit (
                scope, subject_hash, window_started_at, attempt_count, blocked_until, updated_at
            ) values (?, ?, ?, 1, null, ?)
            on conflict (scope, subject_hash) do update set
                attempt_count = case
                    when authentication_rate_limit.blocked_until > excluded.updated_at
                        then authentication_rate_limit.attempt_count
                    when authentication_rate_limit.window_started_at <= ? then 1
                    else authentication_rate_limit.attempt_count + 1
                end,
                window_started_at = case
                    when authentication_rate_limit.blocked_until > excluded.updated_at
                        then authentication_rate_limit.window_started_at
                    when authentication_rate_limit.window_started_at <= ?
                        then excluded.window_started_at
                    else authentication_rate_limit.window_started_at
                end,
                blocked_until = case
                    when authentication_rate_limit.blocked_until > excluded.updated_at
                        then authentication_rate_limit.blocked_until
                    when (
                        case
                            when authentication_rate_limit.window_started_at <= ? then 1
                            else authentication_rate_limit.attempt_count + 1
                        end
                    ) >= ? then ?
                    else null
                end,
                updated_at = excluded.updated_at
            returning blocked_until
            """;

    private final JdbcTemplate jdbcTemplate;
    private final byte[] hashSecret;
    private final int loginMaxFailures;
    private final int loginNetworkMaxFailures;
    private final long loginWindowMinutes;
    private final long loginBlockMinutes;
    private final int mailMaxRequests;
    private final int signupMaxRequests;
    private final int passwordResetNetworkMaxRequests;
    private final long mailWindowMinutes;
    private final long mailBlockMinutes;
    private final long retentionMinutes;

    public AuthenticationRateLimitService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.auth-rate-limit.hash-secret:local-development-only}") String hashSecret,
            @Value("${app.auth-rate-limit.login.max-failures:5}") int loginMaxFailures,
            @Value("${app.auth-rate-limit.login.network-max-failures:50}") int loginNetworkMaxFailures,
            @Value("${app.auth-rate-limit.login.window-minutes:15}") long loginWindowMinutes,
            @Value("${app.auth-rate-limit.login.block-minutes:15}") long loginBlockMinutes,
            @Value("${app.auth-rate-limit.mail.max-requests:3}") int mailMaxRequests,
            @Value("${app.auth-rate-limit.signup.max-requests:10}") int signupMaxRequests,
            @Value("${app.auth-rate-limit.password-reset.network-max-requests:20}") int passwordResetNetworkMaxRequests,
            @Value("${app.auth-rate-limit.mail.window-minutes:60}") long mailWindowMinutes,
            @Value("${app.auth-rate-limit.mail.block-minutes:60}") long mailBlockMinutes
    ) {
        if (hashSecret == null || hashSecret.length() < 16) {
            throw new IllegalArgumentException("Authentication rate-limit hash secret must contain at least 16 characters.");
        }
        if (loginMaxFailures < 1 || loginNetworkMaxFailures < loginMaxFailures
                || mailMaxRequests < 1 || signupMaxRequests < 1 || passwordResetNetworkMaxRequests < mailMaxRequests
                || loginWindowMinutes < 1 || loginBlockMinutes < 1
                || mailWindowMinutes < 1 || mailBlockMinutes < 1) {
            throw new IllegalArgumentException("Authentication rate-limit settings must be positive.");
        }
        this.jdbcTemplate = jdbcTemplate;
        this.hashSecret = hashSecret.getBytes(StandardCharsets.UTF_8);
        this.loginMaxFailures = loginMaxFailures;
        this.loginNetworkMaxFailures = loginNetworkMaxFailures;
        this.loginWindowMinutes = loginWindowMinutes;
        this.loginBlockMinutes = loginBlockMinutes;
        this.mailMaxRequests = mailMaxRequests;
        this.signupMaxRequests = signupMaxRequests;
        this.passwordResetNetworkMaxRequests = passwordResetNetworkMaxRequests;
        this.mailWindowMinutes = mailWindowMinutes;
        this.mailBlockMinutes = mailBlockMinutes;
        this.retentionMinutes = Math.max(
                Math.max(loginWindowMinutes, loginBlockMinutes),
                Math.max(mailWindowMinutes, mailBlockMinutes)
        );
    }

    @Transactional(readOnly = true)
    public void assertLoginAllowed(
            AuthenticationRateLimitScope scope,
            String clientNetwork,
            String subject
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        String network = normalizeClientNetwork(clientNetwork);
        OffsetDateTime subjectBlockedUntil = findBlockedUntil(
                scope,
                networkSubject(network, subject),
                now
        );
        OffsetDateTime networkBlockedUntil = findBlockedUntil(
                AuthenticationRateLimitScope.AUTH_LOGIN_NETWORK,
                network,
                now
        );
        OffsetDateTime blockedUntil = later(subjectBlockedUntil, networkBlockedUntil);
        if (blockedUntil != null) {
            throw new AuthenticationRateLimitExceededException(blockedUntil);
        }
    }

    private OffsetDateTime findBlockedUntil(
            AuthenticationRateLimitScope scope,
            String subject,
            OffsetDateTime now
    ) {
        return jdbcTemplate.query(
                """
                        select blocked_until
                        from platform.authentication_rate_limit
                        where scope = ? and subject_hash = ? and blocked_until > ?
                        """,
                resultSet -> resultSet.next()
                        ? resultSet.getObject("blocked_until", OffsetDateTime.class)
                        : null,
                scope.name(),
                hashSubject(scope, subject),
                now
        );
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = AuthenticationRateLimitExceededException.class
    )
    public void recordLoginFailure(
            AuthenticationRateLimitScope scope,
            String clientNetwork,
            String subject
    ) {
        String network = normalizeClientNetwork(clientNetwork);
        OffsetDateTime subjectBlockedUntil = increment(
                scope,
                networkSubject(network, subject),
                loginMaxFailures,
                loginWindowMinutes,
                loginBlockMinutes
        );
        OffsetDateTime networkBlockedUntil = increment(
                AuthenticationRateLimitScope.AUTH_LOGIN_NETWORK,
                network,
                loginNetworkMaxFailures,
                loginWindowMinutes,
                loginBlockMinutes
        );
        OffsetDateTime blockedUntil = later(subjectBlockedUntil, networkBlockedUntil);
        if (blockedUntil != null) {
            throw new AuthenticationRateLimitExceededException(blockedUntil);
        }
    }

    @Transactional
    public void clearLoginFailures(
            AuthenticationRateLimitScope scope,
            String clientNetwork,
            String subject
    ) {
        String network = normalizeClientNetwork(clientNetwork);
        jdbcTemplate.update(
                "delete from platform.authentication_rate_limit where scope = ? and subject_hash = ?",
                scope.name(),
                hashSubject(scope, networkSubject(network, subject))
        );
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = AuthenticationRateLimitExceededException.class
    )
    public void consumeSignupRequest(String clientNetwork) {
        OffsetDateTime blockedUntil = increment(
                AuthenticationRateLimitScope.CANDIDATE_SIGNUP_NETWORK,
                normalizeClientNetwork(clientNetwork),
                signupMaxRequests + 1,
                mailWindowMinutes,
                mailBlockMinutes
        );
        if (blockedUntil != null) {
            throw new AuthenticationRateLimitExceededException(blockedUntil);
        }
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = AuthenticationRateLimitExceededException.class
    )
    public void consumePasswordResetRequest(String clientNetwork, String normalizedEmail) {
        String network = normalizeClientNetwork(clientNetwork);
        OffsetDateTime subjectBlockedUntil = increment(
                AuthenticationRateLimitScope.CANDIDATE_PASSWORD_RESET,
                networkSubject(network, normalizedEmail),
                mailMaxRequests + 1,
                mailWindowMinutes,
                mailBlockMinutes
        );
        OffsetDateTime networkBlockedUntil = increment(
                AuthenticationRateLimitScope.CANDIDATE_PASSWORD_RESET_NETWORK,
                network,
                passwordResetNetworkMaxRequests + 1,
                mailWindowMinutes,
                mailBlockMinutes
        );
        OffsetDateTime blockedUntil = later(subjectBlockedUntil, networkBlockedUntil);
        if (blockedUntil != null) {
            throw new AuthenticationRateLimitExceededException(blockedUntil);
        }
    }

    @Transactional(
            propagation = Propagation.REQUIRES_NEW,
            noRollbackFor = AuthenticationRateLimitExceededException.class
    )
    public void consumeMailRequest(AuthenticationRateLimitScope scope, String subject) {
        OffsetDateTime blockedUntil = increment(
                scope,
                subject,
                mailMaxRequests + 1,
                mailWindowMinutes,
                mailBlockMinutes
        );
        if (blockedUntil != null) {
            throw new AuthenticationRateLimitExceededException(blockedUntil);
        }
    }

    @Scheduled(
            initialDelayString = "${app.auth-rate-limit.cleanup-initial-delay-ms:3600000}",
            fixedDelayString = "${app.auth-rate-limit.cleanup-delay-ms:3600000}"
    )
    @Transactional
    public void deleteExpiredLimits() {
        OffsetDateTime now = OffsetDateTime.now();
        jdbcTemplate.update(
                """
                        delete from platform.authentication_rate_limit
                        where updated_at < ?
                          and (blocked_until is null or blocked_until <= ?)
                        """,
                now.minusMinutes(retentionMinutes),
                now
        );
    }

    private OffsetDateTime increment(
            AuthenticationRateLimitScope scope,
            String subject,
            int blockThreshold,
            long windowMinutes,
            long blockMinutes
    ) {
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime windowCutoff = now.minusMinutes(windowMinutes);
        OffsetDateTime blockUntil = now.plusMinutes(blockMinutes);
        return jdbcTemplate.queryForObject(
                INCREMENT_SQL,
                OffsetDateTime.class,
                scope.name(),
                hashSubject(scope, subject),
                now,
                now,
                windowCutoff,
                windowCutoff,
                windowCutoff,
                blockThreshold,
                blockUntil
        );
    }

    private String hashSubject(AuthenticationRateLimitScope scope, String subject) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(hashSecret, HMAC_ALGORITHM));
            byte[] digest = mac.doFinal((scope.name() + ":" + subject).getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException | InvalidKeyException exception) {
            throw new IllegalStateException("Authentication rate-limit hashing is unavailable.", exception);
        }
    }

    private String normalizeClientNetwork(String clientNetwork) {
        if (clientNetwork == null) {
            return "unknown";
        }
        String normalized = clientNetwork.trim().toLowerCase();
        if (normalized.isEmpty() || normalized.length() > 64
                || (!normalized.equals("unknown") && !normalized.matches("^[0-9a-f:.]+$"))) {
            return "unknown";
        }
        return normalized;
    }

    private String networkSubject(String network, String subject) {
        return network + "\u0000" + subject;
    }

    private OffsetDateTime later(OffsetDateTime first, OffsetDateTime second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }
}
