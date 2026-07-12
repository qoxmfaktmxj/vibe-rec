package com.viberec.api.recruitment.notification.web;

import java.time.OffsetDateTime;

public record CandidateNotificationResponse(
        Long id,
        Long applicationId,
        String jobPostingTitle,
        String type,
        String title,
        String content,
        OffsetDateTime deliveredAt,
        OffsetDateTime readAt
) {
}
