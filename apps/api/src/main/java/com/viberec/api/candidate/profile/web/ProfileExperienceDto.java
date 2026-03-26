package com.viberec.api.candidate.profile.web;

import java.time.LocalDate;

public record ProfileExperienceDto(
        Long id,
        String company,
        String position,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        int sortOrder
) {}
