package com.viberec.api.admin.hiring.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        Long templateId,
        @NotBlank @Size(max = 40) String type,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 5000) String content
) {
    public CreateNotificationRequest(String type, String title, String content) {
        this(null, type, title, content);
    }
}
