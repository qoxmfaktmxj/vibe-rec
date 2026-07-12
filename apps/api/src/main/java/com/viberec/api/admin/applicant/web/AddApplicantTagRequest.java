package com.viberec.api.admin.applicant.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AddApplicantTagRequest(
        @NotBlank
        @Size(max = 80)
        @Pattern(regexp = "^[\\p{L}\\p{N}][\\p{L}\\p{N} _./+\\-]*$")
        String name
) {
}
