package com.viberec.api.admin.applicant.web;

import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateApplicantReviewStatusRequest(
        @NotNull ApplicationReviewStatus reviewStatus,
        @Size(max = 2000) String reviewNote
) {
}
