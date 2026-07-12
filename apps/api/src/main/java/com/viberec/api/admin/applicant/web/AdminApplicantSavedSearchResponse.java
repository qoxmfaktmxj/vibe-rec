package com.viberec.api.admin.applicant.web;

import java.time.OffsetDateTime;
import java.util.Map;

public record AdminApplicantSavedSearchResponse(
        Long id,
        String name,
        Map<String, String> filters,
        OffsetDateTime createdAt
) {
}
