package com.viberec.api.recruitment.application.service;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationResumeRaw;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.web.ApplicationDraftResponse;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import java.time.OffsetDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationDraftService {

    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;

    public ApplicationDraftService(
            JobPostingRepository jobPostingRepository,
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
    }

    @Transactional
    public ApplicationDraftResponse saveDraft(Long jobPostingId, SaveApplicationDraftRequest request) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        validateDraftWindow(jobPosting);

        Application application = applicationRepository
                .findByJobPostingIdAndApplicantEmailIgnoreCase(jobPostingId, request.applicantEmail())
                .map(existing -> {
                    existing.updateDraft(request.applicantName(), request.applicantPhone());
                    return existing;
                })
                .orElseGet(() -> new Application(
                        jobPosting,
                        request.applicantName(),
                        request.applicantEmail(),
                        request.applicantPhone()
                ));

        Application savedApplication = applicationRepository.save(application);
        ApplicationResumeRaw resumeRaw = applicationResumeRawRepository.findById(savedApplication.getId())
                .map(existing -> {
                    existing.updatePayload(request.resumePayload());
                    return existing;
                })
                .orElseGet(() -> new ApplicationResumeRaw(savedApplication, request.resumePayload()));

        applicationResumeRawRepository.save(resumeRaw);

        return new ApplicationDraftResponse(
                savedApplication.getId(),
                jobPostingId,
                savedApplication.getApplicantEmail(),
                savedApplication.getStatus(),
                savedApplication.getDraftSavedAt()
        );
    }

    private void validateDraftWindow(JobPosting jobPosting) {
        OffsetDateTime now = OffsetDateTime.now();
        if (jobPosting.getStatus() != JobPostingStatus.OPEN || now.isBefore(jobPosting.getOpensAt()) || now.isAfter(jobPosting.getClosesAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Draft save is available only for open job postings.");
        }
    }
}
