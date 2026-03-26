package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;

public record CandidateApplicationSummaryResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingPublicKey,
        String jobPostingTitle,
        String jobPostingHeadline,
        String employmentType,
        String location,
        ApplicationStatus status,
        ApplicationReviewStatus reviewStatus,
        ApplicationFinalStatus finalStatus,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime finalDecidedAt
) {
}
