package com.viberec.api.admin.hiring.web;

import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FinalDecisionRequest(
        @NotNull ApplicationFinalStatus finalStatus,
        @Size(max = 2000) String note
) {
}
