package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;

public record ApplicationDraftResponse(
        Long applicationId,
        Long jobPostingId,
        String applicantEmail,
        ApplicationStatus status,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt
) {
}
