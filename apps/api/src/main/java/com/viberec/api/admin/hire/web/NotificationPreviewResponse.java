package com.viberec.api.admin.hire.web;

import com.viberec.api.recruitment.notification.domain.NotificationChannel;

public record NotificationPreviewResponse(
        Long templateId,
        String templateKey,
        NotificationChannel channel,
        String recipient,
        String subject,
        String body
) {}
