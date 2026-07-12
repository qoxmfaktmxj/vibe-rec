package com.viberec.api.admin.applicant.web;

import java.util.List;

public record AdminApplicantOptionsResponse(
        List<AdminAssigneeResponse> assignees,
        List<AdminApplicantTagResponse> tags
) {
}
