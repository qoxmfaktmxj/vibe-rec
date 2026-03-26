package com.viberec.api.admin.applicant.web;

import java.util.List;

public record AdminApplicantPageResponse(
        List<AdminApplicantSummaryResponse> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
}
