package com.viberec.api.admin.hiring.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateNotificationRequest(
        @NotBlank String type,
        @NotBlank @Size(max = 200) String title,
        @NotBlank String content
) {
}
