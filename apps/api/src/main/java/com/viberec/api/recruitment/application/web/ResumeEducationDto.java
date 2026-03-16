package com.viberec.api.recruitment.application.web;

import java.time.LocalDate;

public record ResumeEducationDto(
        Long id,
        String institution,
        String degree,
        String fieldOfStudy,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        int sortOrder
) {
}
