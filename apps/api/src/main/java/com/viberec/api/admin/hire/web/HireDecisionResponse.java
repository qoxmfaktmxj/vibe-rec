package com.viberec.api.admin.hire.web;

import com.viberec.api.recruitment.hire.domain.HireDecisionType;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record HireDecisionResponse(
        Long decisionId,
        Long applicationId,
        HireDecisionType decision,
        String salaryInfo,
        LocalDate startDate,
        String note,
        OffsetDateTime decidedAt
) {}
