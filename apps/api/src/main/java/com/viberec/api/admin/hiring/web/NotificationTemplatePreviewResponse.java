package com.viberec.api.admin.hiring.web;

public record NotificationTemplatePreviewResponse(
        Long id,
        String code,
        String name,
        String type,
        String title,
        String content
) {
}
