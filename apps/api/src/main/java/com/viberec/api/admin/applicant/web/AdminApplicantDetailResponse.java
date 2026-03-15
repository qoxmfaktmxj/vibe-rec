package com.viberec.api.admin.applicant.web;

import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;
import java.util.Map;

public record AdminApplicantDetailResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingPublicKey,
        String jobPostingTitle,
        String applicantName,
        String applicantEmail,
        String applicantPhone,
        ApplicationStatus applicationStatus,
        ApplicationReviewStatus reviewStatus,
        String reviewNote,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        Map<String, Object> resumePayload
) {
}
