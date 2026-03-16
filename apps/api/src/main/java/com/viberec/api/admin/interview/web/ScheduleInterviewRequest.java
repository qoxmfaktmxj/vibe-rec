package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewType;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record ScheduleInterviewRequest(
        @NotNull InterviewType interviewType,
        @NotNull @Future OffsetDateTime scheduledAt,
        @Min(15) int durationMinutes,
        String location,
        String onlineLink,
        String note
) {}
