package com.viberec.api.platform.security;

import java.time.OffsetDateTime;

public class AuthenticationRateLimitExceededException extends RuntimeException {

    private final OffsetDateTime retryAt;

    public AuthenticationRateLimitExceededException(OffsetDateTime retryAt) {
        super("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");
        this.retryAt = retryAt;
    }

    public OffsetDateTime getRetryAt() {
        return retryAt;
    }
}
