package com.viberec.api.recruitment.application.web;

import java.time.OffsetDateTime;

public record ApplicationEventResponse(
        Long id,
        Long applicationId,
        String eventType,
        String fromState,
        String toState,
        String actorType,
        Long actorId,
        String reason,
        String metadata,
        OffsetDateTime createdAt
) {
}
