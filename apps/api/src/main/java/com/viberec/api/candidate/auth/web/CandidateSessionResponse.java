package com.viberec.api.candidate.auth.web;

import java.time.OffsetDateTime;

public record CandidateSessionResponse(
        Long candidateAccountId,
        String email,
        String name,
        String phone,
        OffsetDateTime authenticatedAt,
        OffsetDateTime expiresAt
) {
}
