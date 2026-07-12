package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.evaluation.domain.EvaluationResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateEvaluationRequest(
        @NotNull @Size(min = 1, max = 20) List<@Valid EvaluationCriterionScoreRequest> criterionScores,
        @Size(max = 2000) String comment,
        @NotNull EvaluationResult result
) {
}
