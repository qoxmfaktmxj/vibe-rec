package com.viberec.api.admin.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentCategory;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import java.time.OffsetDateTime;

public record AdminJobPostingResponse(
        Long id,
        Long legacyAnnoId,
        String publicKey,
        String title,
        String headline,
        String description,
        String employmentType,
        RecruitmentCategory recruitmentCategory,
        RecruitmentMode recruitmentMode,
        String location,
        JobPostingStatus status,
        boolean published,
        OffsetDateTime opensAt,
        OffsetDateTime closesAt
) {
}
