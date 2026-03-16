package com.viberec.api.admin.interview.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddEvaluatorRequest(
        @NotBlank @Size(max = 120) String evaluatorName
) {}
