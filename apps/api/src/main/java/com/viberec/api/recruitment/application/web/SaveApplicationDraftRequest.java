package com.viberec.api.recruitment.application.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record SaveApplicationDraftRequest(
        @NotBlank @Size(max = 120) String applicantName,
        @NotBlank @Email @Size(max = 160) String applicantEmail,
        @NotBlank @Pattern(regexp = "^[0-9+\\-() ]{8,40}$") String applicantPhone,
        @NotNull Map<String, Object> resumePayload
) {
}

