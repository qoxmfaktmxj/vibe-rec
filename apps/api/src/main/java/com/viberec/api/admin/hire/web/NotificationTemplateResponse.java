package com.viberec.api.admin.hire.web;

import com.viberec.api.recruitment.notification.domain.NotificationChannel;

public record NotificationTemplateResponse(
        Long templateId,
        String templateKey,
        String title,
        String bodyTemplate,
        NotificationChannel channel
) {}
