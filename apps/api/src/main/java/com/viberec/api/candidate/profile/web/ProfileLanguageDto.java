package com.viberec.api.candidate.profile.web;

public record ProfileLanguageDto(
        Long id,
        String languageName,
        String proficiency,
        String testName,
        String testScore,
        int sortOrder
) {}
