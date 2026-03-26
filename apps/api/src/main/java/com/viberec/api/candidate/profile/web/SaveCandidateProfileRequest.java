package com.viberec.api.candidate.profile.web;

import java.util.List;

public record SaveCandidateProfileRequest(
        String introductionTemplate,
        String coreStrengthTemplate,
        Integer careerYears,
        List<ProfileEducationDto> educations,
        List<ProfileExperienceDto> experiences,
        List<ProfileSkillDto> skills,
        List<ProfileCertificationDto> certifications,
        List<ProfileLanguageDto> languages
) {}
