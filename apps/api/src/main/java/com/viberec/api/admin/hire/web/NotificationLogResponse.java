package com.viberec.api.admin.hire.web;

import com.viberec.api.recruitment.notification.domain.NotificationChannel;
import com.viberec.api.recruitment.notification.domain.NotificationStatus;
import java.time.OffsetDateTime;

public record NotificationLogResponse(
        Long logId,
        Long applicationId,
        String templateKey,
        NotificationChannel channel,
        String recipient,
        String subject,
        String body,
        NotificationStatus status,
        OffsetDateTime sentAt,
        OffsetDateTime createdAt
) {}
