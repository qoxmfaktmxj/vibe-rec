package com.viberec.api.admin.interview.web;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ScorecardCriterionInput(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 500) String description,
        @Min(1) @Max(100) short weight,
        boolean required
) {
}
