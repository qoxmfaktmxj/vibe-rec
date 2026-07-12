package com.viberec.api.admin.applicant.web;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public record BulkApplicantOperationRequest(
        @NotEmpty @Size(max = 100) List<@NotNull @Positive Long> applicationIds,
        @NotNull BulkApplicantOperation operation,
        Long adminAccountId,
        String tagName,
        Long tagId
) {
}
