package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.domain.InterviewType;
import java.time.OffsetDateTime;
import java.util.List;

public record InterviewResponse(
        Long interviewId,
        Long applicationId,
        InterviewType interviewType,
        OffsetDateTime scheduledAt,
        int durationMinutes,
        String location,
        String onlineLink,
        InterviewStatus status,
        String note,
        OffsetDateTime createdAt,
        List<EvaluatorResponse> evaluators
) {
    public record EvaluatorResponse(
            Long evaluatorId,
            String evaluatorName,
            Short score,
            String comment,
            String result,
            OffsetDateTime evaluatedAt
    ) {}
}
