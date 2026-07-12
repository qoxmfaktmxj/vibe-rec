package com.viberec.api.admin.hiring.web;

import java.time.OffsetDateTime;
import com.viberec.api.recruitment.notification.domain.NotificationChannel;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;

public record NotificationResponse(
        Long id,
        Long applicationId,
        String type,
        String title,
        String content,
        Long sentBy,
        String sentByName,
        NotificationChannel channel,
        NotificationDeliveryStatus deliveryStatus,
        int deliveryAttempts,
        OffsetDateTime nextAttemptAt,
        OffsetDateTime deliveredAt,
        OffsetDateTime readAt,
        String lastError,
        OffsetDateTime createdAt,
        Long templateId,
        int manualRetryCount
) {
}
