package com.viberec.api.candidate.privacy.web;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequestType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateCandidateDataRequest(
        @NotNull CandidateDataRequestType requestType,
        @Size(max = 2000) String message
) {
}
