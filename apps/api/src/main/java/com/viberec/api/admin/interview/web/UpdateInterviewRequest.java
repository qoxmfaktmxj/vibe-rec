package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateInterviewRequest(
        @NotNull InterviewStatus status,
        @Size(max = 2000) String note
) {
}
