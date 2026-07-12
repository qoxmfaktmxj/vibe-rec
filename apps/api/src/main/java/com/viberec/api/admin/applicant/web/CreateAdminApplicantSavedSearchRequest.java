package com.viberec.api.admin.applicant.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.Map;

public record CreateAdminApplicantSavedSearchRequest(
        @NotBlank @Size(max = 80) String name,
        @NotNull @Size(max = 13) Map<String, String> filters
) {
}
