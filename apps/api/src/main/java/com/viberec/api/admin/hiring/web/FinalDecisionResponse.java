package com.viberec.api.admin.hiring.web;

import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import java.time.OffsetDateTime;

public record FinalDecisionResponse(
        Long applicationId,
        ApplicationFinalStatus finalStatus,
        OffsetDateTime finalDecidedAt,
        String finalNote
) {
}
