package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;

public record WithdrawApplicationResponse(
        Long applicationId,
        ApplicationStatus status,
        OffsetDateTime withdrawnAt,
        String withdrawalReason
) {
}
