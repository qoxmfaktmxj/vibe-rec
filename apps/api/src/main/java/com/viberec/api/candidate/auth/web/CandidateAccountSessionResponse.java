package com.viberec.api.candidate.auth.web;

import java.time.OffsetDateTime;

public record CandidateAccountSessionResponse(
        Long id,
        boolean current,
        String userAgent,
        OffsetDateTime lastSeenAt,
        OffsetDateTime createdAt,
        OffsetDateTime expiresAt
) {
}
