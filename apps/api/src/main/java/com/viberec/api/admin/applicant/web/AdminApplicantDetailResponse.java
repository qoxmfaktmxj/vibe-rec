package com.viberec.api.admin.applicant.web;

import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.web.ResumeCertificationDto;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.ResumeLanguageDto;
import com.viberec.api.recruitment.application.web.ResumeSkillDto;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record AdminApplicantDetailResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingPublicKey,
        String jobPostingTitle,
        String applicantName,
        String applicantEmail,
        String applicantPhone,
        ApplicationStatus applicationStatus,
        ApplicationReviewStatus reviewStatus,
        String reviewNote,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        Map<String, Object> resumePayload,
        List<ResumeEducationDto> educations,
        List<ResumeExperienceDto> experiences,
        List<ResumeSkillDto> skills,
        List<ResumeCertificationDto> certifications,
        List<ResumeLanguageDto> languages
) {
}
