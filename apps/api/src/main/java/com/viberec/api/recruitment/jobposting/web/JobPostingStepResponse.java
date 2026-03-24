package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import java.time.OffsetDateTime;

public record JobPostingStepResponse(
        Long id,
        short stepOrder,
        JobPostingStepType stepType,
        String title,
        String description,
        OffsetDateTime startsAt,
        OffsetDateTime endsAt
) {
}

