package com.viberec.api.admin.applicant.web;

import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminApplicantSummaryResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingTitle,
        String applicantName,
        String applicantEmail,
        String applicantPhone,
        ApplicationStatus applicationStatus,
        ApplicationReviewStatus reviewStatus,
        Long assignedAdminId,
        String assignedAdminName,
        List<AdminApplicantTagResponse> tags,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime withdrawnAt,
        String withdrawalReason
) {
}
