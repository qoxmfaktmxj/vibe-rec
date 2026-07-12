package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.domain.InterviewType;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import java.time.OffsetDateTime;
import java.util.List;

public record InterviewResponse(
        Long id,
        Long applicationId,
        Long jobPostingStepId,
        String stepTitle,
        JobPostingStepType stepType,
        InterviewType interviewType,
        OffsetDateTime scheduledAt,
        int durationMinutes,
        String location,
        String onlineLink,
        InterviewStatus status,
        String note,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        List<EvaluationResponse> evaluations
) {
}
