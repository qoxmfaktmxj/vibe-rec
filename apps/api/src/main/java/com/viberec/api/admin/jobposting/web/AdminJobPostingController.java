package com.viberec.api.admin.jobposting.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.admin.jobposting.service.AdminJobPostingService;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.recruitment.jobposting.service.JobPostingService;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingQuestionResponse;
import com.viberec.api.recruitment.jobposting.web.SaveJobPostingQuestionRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class AdminJobPostingController {

    private final AdminAuthService adminAuthService;
    private final AdminJobPostingService adminJobPostingService;
    private final JobPostingRepository jobPostingRepository;
    private final JobPostingStepRepository jobPostingStepRepository;
    private final JobPostingService jobPostingService;

    public AdminJobPostingController(
            AdminAuthService adminAuthService,
            AdminJobPostingService adminJobPostingService,
            JobPostingRepository jobPostingRepository,
            JobPostingStepRepository jobPostingStepRepository,
            JobPostingService jobPostingService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminJobPostingService = adminJobPostingService;
        this.jobPostingRepository = jobPostingRepository;
        this.jobPostingStepRepository = jobPostingStepRepository;
        this.jobPostingService = jobPostingService;
    }

    @PostMapping("/admin/job-postings")
    @RequiresPermission("JOB_POSTING_MANAGE")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminJobPostingResponse createJobPosting(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @Valid @RequestBody AdminJobPostingUpsertRequest request
    ) {
        authorize(sessionToken);
        return adminJobPostingService.createJobPosting(request);
    }

    @GetMapping("/admin/job-postings")
    @RequiresPermission("JOB_POSTING_VIEW")
    public List<AdminJobPostingResponse> getJobPostings(
            @RequestHeader("X-Admin-Session") String sessionToken
    ) {
        authorize(sessionToken);
        return adminJobPostingService.getJobPostings();
    }

    @GetMapping("/admin/job-postings/{id}")
    @RequiresPermission("JOB_POSTING_VIEW")
    public AdminJobPostingResponse getJobPosting(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminJobPostingService.getJobPosting(id);
    }

    @PutMapping("/admin/job-postings/{id}")
    @RequiresPermission("JOB_POSTING_MANAGE")
    public AdminJobPostingResponse updateJobPosting(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody AdminJobPostingUpsertRequest request
    ) {
        authorize(sessionToken);
        return adminJobPostingService.updateJobPosting(id, request);
    }

    @GetMapping("/admin/job-postings/{id}/preview")
    @RequiresPermission("JOB_POSTING_VIEW")
    public AdminJobPostingPreviewResponse getPreview(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminJobPostingService.getPreview(id);
    }

    @PostMapping("/admin/job-postings/{id}/clone")
    @RequiresPermission("JOB_POSTING_MANAGE")
    @ResponseStatus(HttpStatus.CREATED)
    public AdminJobPostingResponse cloneJobPosting(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminJobPostingService.cloneJobPosting(id);
    }

    @PutMapping("/admin/job-postings/{id}/publication")
    @RequiresPermission("JOB_POSTING_MANAGE")
    public AdminJobPostingResponse schedulePublication(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody ScheduleJobPostingPublicationRequest request
    ) {
        authorize(sessionToken);
        return adminJobPostingService.schedulePublication(id, request);
    }

    @GetMapping("/admin/job-postings/{id}/steps")
    @RequiresPermission("JOB_POSTING_VIEW")
    public List<JobPostingStepResponse> getJobPostingSteps(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        jobPostingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        return jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(id).stream()
                .map(this::toStepResponse)
                .toList();
    }

    @GetMapping("/admin/job-postings/{id}/questions")
    @RequiresPermission("JOB_POSTING_VIEW")
    public List<JobPostingQuestionResponse> getJobPostingQuestions(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return jobPostingService.getQuestionsForAdmin(id);
    }

    @PutMapping("/admin/job-postings/{id}/questions")
    @RequiresPermission("JOB_POSTING_MANAGE")
    @ResponseStatus(HttpStatus.OK)
    public void saveJobPostingQuestions(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @RequestBody List<SaveJobPostingQuestionRequest> questions
    ) {
        authorize(sessionToken);
        jobPostingService.saveQuestionsForJobPosting(id, questions);
    }

    private JobPostingStepResponse toStepResponse(JobPostingStep step) {
        return new JobPostingStepResponse(
                step.getId(),
                step.getStepOrder(),
                step.getStepType(),
                step.getTitle(),
                step.getDescription(),
                step.getStartsAt(),
                step.getEndsAt()
        );
    }

    private void authorize(String sessionToken) {
        adminAuthService.getSession(sessionToken);
    }
}
