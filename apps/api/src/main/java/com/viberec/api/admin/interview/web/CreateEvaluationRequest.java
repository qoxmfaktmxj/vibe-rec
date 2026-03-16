package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.evaluation.domain.EvaluationResult;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateEvaluationRequest(
        @Min(1) @Max(5) Short score,
        @Size(max = 2000) String comment,
        @NotNull EvaluationResult result
) {
}
