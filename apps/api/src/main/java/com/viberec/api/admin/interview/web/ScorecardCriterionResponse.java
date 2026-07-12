package com.viberec.api.admin.interview.web;

public record ScorecardCriterionResponse(
        Long id,
        Long jobPostingStepId,
        String name,
        String description,
        short weight,
        boolean required,
        short sortOrder
) {
}
