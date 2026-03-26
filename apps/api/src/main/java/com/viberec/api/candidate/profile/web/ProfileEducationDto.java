package com.viberec.api.candidate.profile.web;

import java.time.LocalDate;

public record ProfileEducationDto(
        Long id,
        String institution,
        String degree,
        String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        int sortOrder
) {}
