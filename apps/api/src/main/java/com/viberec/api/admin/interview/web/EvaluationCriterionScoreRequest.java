package com.viberec.api.admin.interview.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EvaluationCriterionScoreRequest(
        @NotNull Long criterionId,
        @Min(1) @Max(5) short score,
        @Size(max = 1000) String comment
) {
}
