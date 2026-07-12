package com.viberec.api.admin.privacy.web;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateCandidateDataRequestRequest(
        @NotNull CandidateDataRequestStatus status,
        @Size(max = 4000) String resolutionNote
) {
}
