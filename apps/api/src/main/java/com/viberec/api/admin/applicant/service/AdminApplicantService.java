package com.viberec.api.admin.applicant.service;

import com.viberec.api.admin.applicant.web.AdminApplicantDetailResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantPageResponse;
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
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminApplicantService {
    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final int MAX_PAGE_SIZE = 200;

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
        return applicationRepository.findAdminApplicants(
                        jobPostingId,
                        applicationStatus,
                        reviewStatus,
                        normalizeFilterValue(applicantName),
                        normalizeFilterValue(applicantEmail),
                        normalizeFilterValue(applicantPhone),
                        normalizeFilterValue(query)
                ).stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public AdminApplicantPageResponse getApplicantsPage(
            Long jobPostingId,
            ApplicationStatus applicationStatus,
            ApplicationReviewStatus reviewStatus,
            String applicantName,
            String applicantEmail,
            String applicantPhone,
            String query,
            Integer page,
            Integer size
    ) {
        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizePageSize(size);
        var resultPage = applicationRepository.findAdminApplicantsPage(
                jobPostingId,
                applicationStatus,
                reviewStatus,
                normalizeFilterValue(applicantName),
                normalizeFilterValue(applicantEmail),
                normalizeFilterValue(applicantPhone),
                normalizeFilterValue(query),
                PageRequest.of(normalizedPage - 1, normalizedSize)
        );

        return new AdminApplicantPageResponse(
                resultPage.getContent().stream()
                        .map(this::toSummaryResponse)
                        .toList(),
                normalizedPage,
                normalizedSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
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

    private String normalizeFilterValue(String query) {
        String normalized = normalizeQuery(query);
        return normalized == null ? "" : escapeLikeValue(normalized);
    }

    private String escapeLikeValue(String value) {
        if (value == null) return null;
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private String normalizeReviewNote(String reviewNote) {
        if (reviewNote == null) {
            return null;
        }

        String normalized = reviewNote.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private int normalizePage(Integer page) {
        if (page == null || page < 1) {
            return 1;
        }
        return page;
    }

    private int normalizePageSize(Integer size) {
        if (size == null || size < 1) {
            return DEFAULT_PAGE_SIZE;
        }
        return Math.min(size, MAX_PAGE_SIZE);
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
                application.getFinalStatus(),
                application.getFinalDecidedAt(),
                application.getFinalNote(),
                resumePayload,
                educations,
                experiences,
                skills,
                certifications,
                languages
        );
    }
}
