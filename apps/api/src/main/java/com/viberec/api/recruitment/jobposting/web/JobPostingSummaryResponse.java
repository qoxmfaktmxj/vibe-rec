package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentCategory;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import java.time.OffsetDateTime;

public record JobPostingSummaryResponse(
        Long id,
        String publicKey,
        String title,
        String headline,
        String employmentType,
        RecruitmentCategory recruitmentCategory,
        RecruitmentMode recruitmentMode,
        String location,
        JobPostingStatus status,
        OffsetDateTime opensAt,
        OffsetDateTime closesAt,
        int stepCount
) {
}
