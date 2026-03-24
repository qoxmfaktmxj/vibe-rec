package com.viberec.api.admin.jobposting.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
public class AdminJobPostingController {

    private final AdminAuthService adminAuthService;
    private final JobPostingRepository jobPostingRepository;
    private final JobPostingStepRepository jobPostingStepRepository;

    public AdminJobPostingController(
            AdminAuthService adminAuthService,
            JobPostingRepository jobPostingRepository,
            JobPostingStepRepository jobPostingStepRepository
    ) {
        this.adminAuthService = adminAuthService;
        this.jobPostingRepository = jobPostingRepository;
        this.jobPostingStepRepository = jobPostingStepRepository;
    }

    @GetMapping("/admin/job-postings/{id}/steps")
    @RequiresPermission("APPLICANT_VIEW")
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
