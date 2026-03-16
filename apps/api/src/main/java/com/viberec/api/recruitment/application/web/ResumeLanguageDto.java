package com.viberec.api.recruitment.application.web;

public record ResumeLanguageDto(
        Long id,
        String languageName,
        String proficiency,
        String testName,
        String testScore,
        int sortOrder
) {
}
