package com.viberec.api.admin.interview.web;

import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateInterviewStatusRequest(
        @NotNull InterviewStatus status
) {}
