package com.viberec.api.recruitment.jobposting.service;

import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.jobposting.web.JobPostingDetailResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingSummaryResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;

    public JobPostingService(JobPostingRepository jobPostingRepository) {
        this.jobPostingRepository = jobPostingRepository;
    }

    public List<JobPostingSummaryResponse> getPublishedJobPostings() {
        return jobPostingRepository.findByPublishedTrueOrderByOpensAtDesc().stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public JobPostingDetailResponse getJobPosting(Long id) {
        JobPosting jobPosting = jobPostingRepository.findWithStepsById(id)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        return new JobPostingDetailResponse(
                jobPosting.getId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getDescription(),
                jobPosting.getEmploymentType(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt(),
                jobPosting.getSteps().stream().map(this::toStepResponse).toList()
        );
    }

    private JobPostingSummaryResponse toSummaryResponse(JobPosting jobPosting) {
        return new JobPostingSummaryResponse(
                jobPosting.getId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getEmploymentType(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt(),
                jobPosting.getSteps().size()
        );
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
}

