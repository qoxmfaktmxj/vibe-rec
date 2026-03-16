package com.viberec.api.admin.hiring.web;

import java.time.OffsetDateTime;

public record NotificationResponse(
        Long id,
        Long applicationId,
        String type,
        String title,
        String content,
        Long sentBy,
        String sentByName,
        OffsetDateTime createdAt
) {
}
