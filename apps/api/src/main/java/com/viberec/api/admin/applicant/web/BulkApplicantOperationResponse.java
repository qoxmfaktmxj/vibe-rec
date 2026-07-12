package com.viberec.api.admin.applicant.web;

public record BulkApplicantOperationResponse(
        BulkApplicantOperation operation,
        int requestedCount,
        int changedCount
) {
}
