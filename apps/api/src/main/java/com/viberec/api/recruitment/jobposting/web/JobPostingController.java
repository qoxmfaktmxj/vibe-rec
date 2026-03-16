package com.viberec.api.recruitment.jobposting.web;

import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.ApplicationDraftResponse;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.service.JobPostingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/job-postings")
public class JobPostingController {

    private final JobPostingService jobPostingService;
    private final ApplicationDraftService applicationDraftService;

    public JobPostingController(JobPostingService jobPostingService, ApplicationDraftService applicationDraftService) {
        this.jobPostingService = jobPostingService;
        this.applicationDraftService = applicationDraftService;
    }

    @GetMapping
    public List<JobPostingSummaryResponse> getJobPostings() {
        return jobPostingService.getPublishedJobPostings();
    }

    @GetMapping("/{id}")
    public JobPostingDetailResponse getJobPosting(@PathVariable Long id) {
        return jobPostingService.getJobPosting(id);
    }

    @PostMapping("/{id}/application-draft")
    public ApplicationDraftResponse saveApplicationDraft(
            @PathVariable Long id,
            @Valid @RequestBody SaveApplicationDraftRequest request
    ) {
        return applicationDraftService.saveDraft(id, request);
    }

    @PostMapping("/{id}/application-submit")
    public ApplicationDraftResponse submitApplication(
            @PathVariable Long id,
            @Valid @RequestBody SaveApplicationDraftRequest request
    ) {
        return applicationDraftService.submit(id, request);
    }
}
