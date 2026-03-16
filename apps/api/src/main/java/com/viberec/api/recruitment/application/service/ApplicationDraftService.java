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
    private final ResumeNormalizationService resumeNormalizationService;

    public ApplicationDraftService(
            JobPostingRepository jobPostingRepository,
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
    }

    @Transactional
    public ApplicationDraftResponse saveDraft(Long jobPostingId, SaveApplicationDraftRequest request) {
        JobPosting jobPosting = loadActiveJobPosting(jobPostingId);
        Application application = applicationRepository
                .findByJobPostingIdAndApplicantEmailIgnoreCase(jobPostingId, request.applicantEmail())
                .map(existing -> {
                    ensureEditable(existing);
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
        saveResumeRaw(savedApplication, request.resumePayload());
        resumeNormalizationService.saveNormalizedResume(
                savedApplication, request.educations(), request.experiences(),
                request.skills(), request.certifications(), request.languages());
        return toResponse(savedApplication, jobPostingId);
    }

    @Transactional
    public ApplicationDraftResponse submit(Long jobPostingId, SaveApplicationDraftRequest request) {
        JobPosting jobPosting = loadActiveJobPosting(jobPostingId);
        validateSubmitPayload(request.resumePayload());

        Application application = applicationRepository
                .findByJobPostingIdAndApplicantEmailIgnoreCase(jobPostingId, request.applicantEmail())
                .map(existing -> {
                    ensureEditable(existing);
                    existing.submit(request.applicantName(), request.applicantPhone());
                    return existing;
                })
                .orElseGet(() -> {
                    Application created = new Application(
                            jobPosting,
                            request.applicantName(),
                            request.applicantEmail(),
                            request.applicantPhone()
                    );
                    created.submit(request.applicantName(), request.applicantPhone());
                    return created;
                });

        Application savedApplication = applicationRepository.save(application);
        saveResumeRaw(savedApplication, request.resumePayload());
        resumeNormalizationService.saveNormalizedResume(
                savedApplication, request.educations(), request.experiences(),
                request.skills(), request.certifications(), request.languages());
        return toResponse(savedApplication, jobPostingId);
    }

    private JobPosting loadActiveJobPosting(Long jobPostingId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        validateApplicationWindow(jobPosting);
        return jobPosting;
    }

    private void validateApplicationWindow(JobPosting jobPosting) {
        OffsetDateTime now = OffsetDateTime.now();
        if (jobPosting.getStatus() != JobPostingStatus.OPEN || now.isBefore(jobPosting.getOpensAt()) || now.isAfter(jobPosting.getClosesAt())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Applications are available only for open job postings.");
        }
    }

    private void ensureEditable(Application application) {
        if (application.isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Application is already submitted for this posting.");
        }
    }

    private void validateSubmitPayload(java.util.Map<String, Object> resumePayload) {
        String introduction = readPayloadText(resumePayload, "introduction");
        if (introduction == null || introduction.length() < 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Introduction must be at least 20 characters long before submit.");
        }

        String coreStrength = readPayloadText(resumePayload, "coreStrength");
        if (coreStrength == null || coreStrength.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Core strength must be at least 10 characters long before submit.");
        }
    }

    private String readPayloadText(java.util.Map<String, Object> resumePayload, String key) {
        Object value = resumePayload.get(key);
        if (value == null) {
            return null;
        }

        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    private void saveResumeRaw(Application application, java.util.Map<String, Object> resumePayload) {
        ApplicationResumeRaw resumeRaw = applicationResumeRawRepository.findById(application.getId())
                .map(existing -> {
                    existing.updatePayload(resumePayload);
                    return existing;
                })
                .orElseGet(() -> new ApplicationResumeRaw(application, resumePayload));

        applicationResumeRawRepository.save(resumeRaw);
    }

    private ApplicationDraftResponse toResponse(Application application, Long jobPostingId) {
        return new ApplicationDraftResponse(
                application.getId(),
                jobPostingId,
                application.getApplicantEmail(),
                application.getStatus(),
                application.getDraftSavedAt(),
                application.getSubmittedAt()
        );
    }
}
