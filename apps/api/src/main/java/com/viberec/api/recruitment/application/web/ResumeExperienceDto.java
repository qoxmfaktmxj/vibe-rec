package com.viberec.api.recruitment.application.web;

import java.time.LocalDate;

public record ResumeExperienceDto(
        Long id,
        String company,
        String position,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        int sortOrder
) {
}
