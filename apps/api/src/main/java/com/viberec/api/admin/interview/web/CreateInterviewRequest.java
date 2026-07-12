package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record CreateInterviewRequest(
        Long jobPostingStepId,
        Short stepOrder,
        @NotNull InterviewType interviewType,
        @NotNull @Future OffsetDateTime scheduledAt,
        @Min(15) @Max(480) int durationMinutes,
        @Size(max = 300) String location,
        @Size(max = 1000) String onlineLink,
        @Size(max = 2000) String note
) {
}
