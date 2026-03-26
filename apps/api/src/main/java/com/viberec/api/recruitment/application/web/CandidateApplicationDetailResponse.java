package com.viberec.api.recruitment.application.web;

import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

public record CandidateApplicationDetailResponse(
        Long applicationId,
        Long jobPostingId,
        String jobPostingTitle,
        String applicantName,
        String applicantEmail,
        String applicantPhone,
        ApplicationStatus status,
        ApplicationReviewStatus reviewStatus,
        ApplicationFinalStatus finalStatus,
        OffsetDateTime draftSavedAt,
        OffsetDateTime submittedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime finalDecidedAt,
        Map<String, Object> resumePayload,
        List<ResumeEducationDto> educations,
        List<ResumeExperienceDto> experiences,
        List<ResumeSkillDto> skills,
        List<ResumeCertificationDto> certifications,
        List<ResumeLanguageDto> languages,
        Short currentStep,
        String motivationFit,
        List<ApplicationAnswerDto> answers
) {
}
