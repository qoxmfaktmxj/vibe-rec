package com.viberec.api.admin.jobposting.web;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentCategory;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;

public record AdminJobPostingUpsertRequest(
        Long legacyAnnoId,
        @NotBlank String publicKey,
        @NotBlank String title,
        @NotBlank String headline,
        @NotBlank String description,
        @NotBlank String employmentType,
        @NotNull RecruitmentCategory recruitmentCategory,
        @NotNull RecruitmentMode recruitmentMode,
        @NotBlank String location,
        @NotNull JobPostingStatus status,
        boolean published,
        @NotNull OffsetDateTime opensAt,
        OffsetDateTime closesAt
) {
}
