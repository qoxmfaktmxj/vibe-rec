package com.viberec.api.candidate.profile.web;

public record ProfileSkillDto(
        Long id,
        String skillName,
        String proficiency,
        Integer years,
        int sortOrder
) {}
