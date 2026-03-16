package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.evaluation.domain.EvaluationResult;
import java.time.OffsetDateTime;

public record EvaluationResponse(
        Long id,
        Long interviewId,
        Long evaluatorId,
        String evaluatorName,
        Short score,
        String comment,
        EvaluationResult result,
        OffsetDateTime createdAt
) {
}
