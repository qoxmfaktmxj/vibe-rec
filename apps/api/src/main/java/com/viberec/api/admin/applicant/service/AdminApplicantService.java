package com.viberec.api.admin.applicant.service;

import com.viberec.api.admin.applicant.web.AdminApplicantDetailResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantSummaryResponse;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminApplicantService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;

    public AdminApplicantService(
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
    }

    public List<AdminApplicantSummaryResponse> getApplicants(
            Long jobPostingId,
            ApplicationStatus applicationStatus,
            ApplicationReviewStatus reviewStatus,
            String query
    ) {
        String normalizedQuery = normalizeQuery(query);

        return applicationRepository.findAdminApplicants(jobPostingId, applicationStatus, reviewStatus, normalizedQuery).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public AdminApplicantDetailResponse getApplicant(Long applicationId) {
        Application application = loadApplication(applicationId);
        Map<String, Object> resumePayload = applicationResumeRawRepository.findById(applicationId)
                .map(raw -> raw.getPayload())
                .orElseGet(Map::of);

        return toDetailResponse(application, resumePayload);
    }

    @Transactional
    public AdminApplicantDetailResponse updateReviewStatus(
            Long applicationId,
            UpdateApplicantReviewStatusRequest request
    ) {
        Application application = loadApplication(applicationId);
        validateReviewTransition(application, request.reviewStatus());
        application.updateReviewStatus(request.reviewStatus(), normalizeReviewNote(request.reviewNote()));

        Map<String, Object> resumePayload = applicationResumeRawRepository.findById(applicationId)
                .map(raw -> raw.getPayload())
                .orElseGet(Map::of);

        return toDetailResponse(application, resumePayload);
    }

    private Application loadApplication(Long applicationId) {
        return applicationRepository.findWithJobPostingById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant not found."));
    }

    private void validateReviewTransition(Application application, ApplicationReviewStatus targetStatus) {
        if (application.getStatus() != ApplicationStatus.SUBMITTED && targetStatus != ApplicationReviewStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can enter recruiter review.");
        }

        ApplicationReviewStatus currentStatus = application.getReviewStatus();
        if (currentStatus == targetStatus) {
            return;
        }

        if (targetStatus == ApplicationReviewStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Review status cannot move back to NEW.");
        }

        if (currentStatus == ApplicationReviewStatus.NEW && targetStatus != ApplicationReviewStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Move the applicant into IN_REVIEW before making a final decision.");
        }

        if ((currentStatus == ApplicationReviewStatus.PASSED || currentStatus == ApplicationReviewStatus.REJECTED)
                && targetStatus == ApplicationReviewStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A final review decision cannot move back to IN_REVIEW.");
        }
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeReviewNote(String reviewNote) {
        if (reviewNote == null) {
            return null;
        }

        String normalized = reviewNote.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private AdminApplicantSummaryResponse toSummaryResponse(Application application) {
        return new AdminApplicantSummaryResponse(
                application.getId(),
                application.getJobPosting().getId(),
                application.getJobPosting().getTitle(),
                application.getApplicantName(),
                application.getApplicantEmail(),
                application.getApplicantPhone(),
                application.getStatus(),
                application.getReviewStatus(),
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt()
        );
    }

    private AdminApplicantDetailResponse toDetailResponse(Application application, Map<String, Object> resumePayload) {
        return new AdminApplicantDetailResponse(
                application.getId(),
                application.getJobPosting().getId(),
                application.getJobPosting().getPublicKey(),
                application.getJobPosting().getTitle(),
                application.getApplicantName(),
                application.getApplicantEmail(),
                application.getApplicantPhone(),
                application.getStatus(),
                application.getReviewStatus(),
                application.getReviewNote(),
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                resumePayload
        );
    }
}
