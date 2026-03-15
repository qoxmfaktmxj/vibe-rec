package com.viberec.api.admin.applicant.web;

import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;

public record AdminApplicantSummaryResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingTitle,
        String applicantName,
        String applicantEmail,
        String applicantPhone,
        ApplicationStatus applicationStatus,
        ApplicationReviewStatus reviewStatus,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt
) {
}
