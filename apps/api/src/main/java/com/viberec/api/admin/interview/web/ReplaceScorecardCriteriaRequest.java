package com.viberec.api.admin.interview.web;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ReplaceScorecardCriteriaRequest(
        @NotNull @Size(min = 1, max = 20) List<@Valid ScorecardCriterionInput> criteria
) {
}
