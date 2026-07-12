package com.viberec.api.admin.jobposting.web;

import com.viberec.api.recruitment.jobposting.web.JobPostingQuestionResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import java.util.List;

public record AdminJobPostingPreviewResponse(
        AdminJobPostingResponse jobPosting,
        List<JobPostingStepResponse> steps,
        List<JobPostingQuestionResponse> questions
) {
}
