package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewResult;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SubmitEvaluationRequest(
        @NotNull @Min(1) @Max(5) Short score,
        String comment,
        @NotNull InterviewResult result
) {}
