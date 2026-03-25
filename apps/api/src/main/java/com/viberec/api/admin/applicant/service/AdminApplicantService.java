package com.viberec.api.admin.applicant.service;

import com.viberec.api.admin.applicant.web.AdminApplicantDetailResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantSummaryResponse;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ResumeNormalizationService;
import com.viberec.api.recruitment.application.web.ResumeCertificationDto;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.ResumeLanguageDto;
import com.viberec.api.recruitment.application.web.ResumeSkillDto;
import java.time.OffsetDateTime;
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
    private final ResumeNormalizationService resumeNormalizationService;

    public AdminApplicantService(
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
    }

    public List<AdminApplicantSummaryResponse> getApplicants(
            Long jobPostingId,
            ApplicationStatus applicationStatus,
            ApplicationReviewStatus reviewStatus,
            String applicantName,
            String applicantEmail,
            String applicantPhone,
            String query
    ) {
        String normalizedApplicantName = normalizeQuery(applicantName);
        String normalizedApplicantEmail = normalizeQuery(applicantEmail);
        String normalizedApplicantPhone = normalizeQuery(applicantPhone);
        String normalizedQuery = normalizeQuery(query);

        return applicationRepository.findAllWithJobPosting().stream()
                .filter(application -> jobPostingId == null || application.getJobPosting().getId().equals(jobPostingId))
                .filter(application -> applicationStatus == null || application.getStatus() == applicationStatus)
                .filter(application -> reviewStatus == null || application.getReviewStatus() == reviewStatus)
                .filter(application -> matches(application.getApplicantName(), normalizedApplicantName))
                .filter(application -> matches(application.getApplicantEmail(), normalizedApplicantEmail))
                .filter(application -> matches(application.getApplicantPhone(), normalizedApplicantPhone))
                .filter(application -> matchesAny(application, normalizedQuery))
                .sorted((left, right) -> compareRecency(left, right))
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
    public AdminApplicantDetailResponse updateReviewStatus(Long applicationId, UpdateApplicantReviewStatusRequest request) {
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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));
    }

    private void validateReviewTransition(Application application, ApplicationReviewStatus targetStatus) {
        if (application.getStatus() != ApplicationStatus.SUBMITTED && targetStatus != ApplicationReviewStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can change review status.");
        }

        ApplicationReviewStatus currentStatus = application.getReviewStatus();
        if (currentStatus == targetStatus) {
            return;
        }

        if (targetStatus == ApplicationReviewStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Review status cannot move back to NEW.");
        }

        if (currentStatus == ApplicationReviewStatus.NEW && targetStatus != ApplicationReviewStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Applications must move to IN_REVIEW before a final review result.");
        }

        if ((currentStatus == ApplicationReviewStatus.PASSED || currentStatus == ApplicationReviewStatus.REJECTED)
                && targetStatus == ApplicationReviewStatus.IN_REVIEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Final review results cannot move back to IN_REVIEW.");
        }
    }

    private String normalizeQuery(String query) {
        if (query == null) {
            return null;
        }

        String normalized = query.trim().toLowerCase();
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeReviewNote(String reviewNote) {
        if (reviewNote == null) {
            return null;
        }

        String normalized = reviewNote.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private boolean matches(String value, String query) {
        return query == null || (value != null && value.toLowerCase().contains(query));
    }

    private boolean matchesAny(Application application, String query) {
        if (query == null) {
            return true;
        }

        return matches(application.getApplicantName(), query)
                || matches(application.getApplicantEmail(), query)
                || matches(application.getApplicantPhone(), query)
                || matches(application.getJobPosting().getTitle(), query);
    }

    private int compareRecency(Application left, Application right) {
        OffsetDateTime leftTimestamp = left.getSubmittedAt() != null ? left.getSubmittedAt() : left.getDraftSavedAt();
        OffsetDateTime rightTimestamp = right.getSubmittedAt() != null ? right.getSubmittedAt() : right.getDraftSavedAt();
        int timestampCompare = rightTimestamp.compareTo(leftTimestamp);
        return timestampCompare != 0 ? timestampCompare : right.getId().compareTo(left.getId());
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
        Long applicationId = application.getId();
        List<ResumeEducationDto> educations = resumeNormalizationService.getEducations(applicationId);
        List<ResumeExperienceDto> experiences = resumeNormalizationService.getExperiences(applicationId);
        List<ResumeSkillDto> skills = resumeNormalizationService.getSkills(applicationId);
        List<ResumeCertificationDto> certifications = resumeNormalizationService.getCertifications(applicationId);
        List<ResumeLanguageDto> languages = resumeNormalizationService.getLanguages(applicationId);

        return new AdminApplicantDetailResponse(
                applicationId,
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
                resumePayload,
                educations,
                experiences,
                skills,
                certifications,
                languages
        );
    }
}
