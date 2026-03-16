package com.viberec.api.admin.hire.web;

import com.viberec.api.recruitment.hire.domain.HireDecisionType;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record CreateHireDecisionRequest(
        @NotNull HireDecisionType decision,
        String salaryInfo,
        LocalDate startDate,
        String note
) {}
