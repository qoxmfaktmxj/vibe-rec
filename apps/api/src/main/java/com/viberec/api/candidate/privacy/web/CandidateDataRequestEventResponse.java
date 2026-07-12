package com.viberec.api.candidate.privacy.web;

import java.time.OffsetDateTime;

public record CandidateDataRequestEventResponse(
        Long id,
        String fromStatus,
        String toStatus,
        String actorType,
        String note,
        OffsetDateTime createdAt
) {
}
