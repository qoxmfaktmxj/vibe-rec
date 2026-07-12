package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.domain.InterviewType;
import java.time.OffsetDateTime;

public record CandidateInterviewResponse(
        Long id,
        String stepTitle,
        InterviewType interviewType,
        OffsetDateTime scheduledAt,
        int durationMinutes,
        String location,
        String onlineLink,
        InterviewStatus status
) {
}
