package com.viberec.api.admin.interview.web;

public record EvaluationCriterionScoreResponse(
        Long criterionId,
        String criterionName,
        short weight,
        boolean required,
        short score,
        String comment
) {
}
