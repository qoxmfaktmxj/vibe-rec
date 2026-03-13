package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record JobPostingDetailResponse(
        Long id,
        String publicKey,
        String title,
        String headline,
        String description,
        String employmentType,
        String location,
        JobPostingStatus status,
        OffsetDateTime opensAt,
        OffsetDateTime closesAt,
        List<JobPostingStepResponse> steps
) {
}

