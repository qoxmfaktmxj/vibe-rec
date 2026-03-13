package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import java.time.OffsetDateTime;

public record JobPostingStepResponse(
        short stepOrder,
        JobPostingStepType stepType,
        String title,
        String description,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt
) {
}

