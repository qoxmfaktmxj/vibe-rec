package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.domain.CandidateNextAction;
import com.viberec.api.recruitment.application.domain.CandidateVisibleStage;
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
        CandidateVisibleStage candidateVisibleStage,
        CandidateNextAction nextAction,
        OffsetDateTime lastChangedAt,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime finalDecidedAt,
        OffsetDateTime withdrawnAt,
        String withdrawalReason
) {
}
