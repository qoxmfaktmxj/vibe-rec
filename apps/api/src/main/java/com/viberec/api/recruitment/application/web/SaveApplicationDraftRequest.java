package com.viberec.api.recruitment.application.web;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public record SaveApplicationDraftRequest(
        @NotNull Map<String, Object> resumePayload,
        List<ResumeEducationDto> educations,
        List<ResumeExperienceDto> experiences,
        List<ResumeSkillDto> skills,
        List<ResumeCertificationDto> certifications,
        List<ResumeLanguageDto> languages
) {
}
