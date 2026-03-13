package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import java.time.OffsetDateTime;

public record JobPostingSummaryResponse(
        Long id,
        String publicKey,
        String title,
        String headline,
        String employmentType,
        String location,
        JobPostingStatus status,
        OffsetDateTime opensAt,
        OffsetDateTime closesAt,
        int stepCount
) {
}

