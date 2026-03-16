package com.viberec.api.recruitment.application.web;

public record ResumeSkillDto(
        Long id,
        String skillName,
        String proficiency,
        Integer years,
        int sortOrder
) {
}
