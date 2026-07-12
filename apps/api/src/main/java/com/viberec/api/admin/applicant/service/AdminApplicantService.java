package com.viberec.api.admin.applicant.service;

import com.viberec.api.admin.applicant.domain.ApplicantTag;
import com.viberec.api.admin.applicant.domain.ApplicationTag;
import com.viberec.api.admin.applicant.repository.ApplicantTagRepository;
import com.viberec.api.admin.applicant.repository.ApplicationTagRepository;
import com.viberec.api.admin.applicant.web.AddApplicantTagRequest;
import com.viberec.api.admin.applicant.web.AdminApplicantDetailResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantOptionsResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantPageResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantSortField;
import com.viberec.api.admin.applicant.web.AdminApplicantSummaryResponse;
import com.viberec.api.admin.applicant.web.AdminApplicantTagResponse;
import com.viberec.api.admin.applicant.web.AdminAssigneeResponse;
import com.viberec.api.admin.applicant.web.AdminSortDirection;
import com.viberec.api.admin.applicant.web.BulkApplicantOperation;
import com.viberec.api.admin.applicant.web.BulkApplicantOperationRequest;
import com.viberec.api.admin.applicant.web.BulkApplicantOperationResponse;
import com.viberec.api.admin.applicant.web.UpdateApplicantAssigneeRequest;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.application.service.ResumeNormalizationService;
import com.viberec.api.recruitment.application.web.ResumeCertificationDto;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.ResumeLanguageDto;
import com.viberec.api.recruitment.application.web.ResumeSkillDto;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminApplicantService {
    private static final int DEFAULT_PAGE_SIZE = 30;
    private static final int MAX_PAGE_SIZE = 200;

    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;
    private final ResumeNormalizationService resumeNormalizationService;
    private final ApplicationEventService applicationEventService;
    private final AdminAccountRepository adminAccountRepository;
    private final ApplicantTagRepository applicantTagRepository;
    private final ApplicationTagRepository applicationTagRepository;

    public AdminApplicantService(
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService,
            ApplicationEventService applicationEventService,
            AdminAccountRepository adminAccountRepository,
            ApplicantTagRepository applicantTagRepository,
            ApplicationTagRepository applicationTagRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
        this.applicationEventService = applicationEventService;
        this.adminAccountRepository = adminAccountRepository;
        this.applicantTagRepository = applicantTagRepository;
        this.applicationTagRepository = applicationTagRepository;
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
        List<Application> applications = applicationRepository.findAdminApplicants(
                jobPostingId,
                applicationStatus,
                reviewStatus,
                normalizeFilterValue(applicantName),
                normalizeFilterValue(applicantEmail),
                normalizeFilterValue(applicantPhone),
                normalizeFilterValue(query)
        );
        Map<Long, List<AdminApplicantTagResponse>> tags = loadTags(applications);
        return applications.stream().map(application -> toSummaryResponse(application, tags.getOrDefault(application.getId(), List.of()))).toList();
    }

    public AdminApplicantPageResponse getApplicantsPage(
            Long jobPostingId,
            ApplicationStatus applicationStatus,
            ApplicationReviewStatus reviewStatus,
            Long assignedAdminId,
            Long tagId,
            String applicantName,
            String applicantEmail,
            String applicantPhone,
            String query,
            AdminApplicantSortField sortField,
            AdminSortDirection sortDirection,
            Integer page,
            Integer size
    ) {
        int normalizedPage = normalizePage(page);
        int normalizedSize = normalizePageSize(size);
        var resultPage = applicationRepository.findAdminApplicantsPage(
                jobPostingId,
                applicationStatus,
                reviewStatus,
                assignedAdminId,
                tagId,
                normalizeFilterValue(applicantName),
                normalizeFilterValue(applicantEmail),
                normalizeFilterValue(applicantPhone),
                normalizeFilterValue(query),
                PageRequest.of(normalizedPage - 1, normalizedSize, buildSort(sortField, sortDirection))
        );
        Map<Long, List<AdminApplicantTagResponse>> tags = loadTags(resultPage.getContent());

        return new AdminApplicantPageResponse(
                resultPage.getContent().stream()
                        .map(application -> toSummaryResponse(application, tags.getOrDefault(application.getId(), List.of())))
                        .toList(),
                normalizedPage,
                normalizedSize,
                resultPage.getTotalElements(),
                resultPage.getTotalPages()
        );
    }

    public AdminApplicantDetailResponse getApplicant(Long applicationId) {
        return buildDetailResponse(loadApplication(applicationId));
    }

    public AdminApplicantOptionsResponse getApplicantOptions() {
        return new AdminApplicantOptionsResponse(
                adminAccountRepository.findAllByActiveTrueOrderByDisplayNameAsc().stream()
                        .map(account -> new AdminAssigneeResponse(account.getId(), account.getDisplayName()))
                        .toList(),
                applicantTagRepository.findAllByOrderByNameAsc().stream()
                        .map(tag -> new AdminApplicantTagResponse(tag.getId(), tag.getName()))
                        .toList()
        );
    }

    @Transactional
    public AdminApplicantDetailResponse updateReviewStatus(Long applicationId, UpdateApplicantReviewStatusRequest request) {
        return updateReviewStatus(applicationId, request, "SYSTEM", null);
    }

    @Transactional
    public AdminApplicantDetailResponse updateReviewStatus(
            Long applicationId,
            UpdateApplicantReviewStatusRequest request,
            String actorType,
            Long actorId
    ) {
        Application application = loadApplication(applicationId);
        validateReviewTransition(application, request.reviewStatus());
        ApplicationReviewStatus previousStatus = application.getReviewStatus();
        application.updateReviewStatus(request.reviewStatus(), normalizeReviewNote(request.reviewNote()));
        if (previousStatus != request.reviewStatus()) {
            applicationEventService.record(
                    application,
                    "REVIEW_STATUS_CHANGED",
                    previousStatus.name(),
                    request.reviewStatus().name(),
                    actorType,
                    actorId,
                    normalizeReviewNote(request.reviewNote()),
                    null
            );
        }
        return buildDetailResponse(application);
    }

    @Transactional
    public AdminApplicantDetailResponse updateAssignee(
            Long applicationId,
            UpdateApplicantAssigneeRequest request,
            Long actorId
    ) {
        Application application = loadApplication(applicationId);
        AdminAccount previousAssignee = application.getAssignedAdmin();
        AdminAccount nextAssignee = request.adminAccountId() == null
                ? null
                : loadActiveAdmin(request.adminAccountId());
        if (sameAdmin(previousAssignee, nextAssignee)) {
            return buildDetailResponse(application);
        }

        application.assignTo(nextAssignee);
        applicationEventService.record(
                application,
                "ASSIGNEE_CHANGED",
                adminId(previousAssignee),
                adminId(nextAssignee),
                "ADMIN",
                actorId,
                null,
                null
        );
        return buildDetailResponse(application);
    }

    @Transactional
    public AdminApplicantDetailResponse addTag(Long applicationId, AddApplicantTagRequest request, Long actorId) {
        Application application = loadApplication(applicationId);
        AdminAccount actor = loadActiveAdmin(actorId);
        String name = normalizeTagName(request.name());
        String normalizedName = name.toLowerCase(Locale.ROOT);
        applicantTagRepository.createIfAbsent(name, normalizedName, actorId);
        ApplicantTag tag = applicantTagRepository.findByNormalizedName(normalizedName)
                .orElseThrow(() -> new IllegalStateException("Applicant tag was not created."));

        if (!applicationTagRepository.existsByApplicationIdAndTagId(applicationId, tag.getId())) {
            applicationTagRepository.save(new ApplicationTag(application, tag, actor));
            applicationEventService.record(
                    application,
                    "TAG_ADDED",
                    null,
                    tag.getName(),
                    "ADMIN",
                    actorId,
                    null,
                    "{\"tagId\":" + tag.getId() + "}"
            );
        }
        return buildDetailResponse(application);
    }

    @Transactional
    public AdminApplicantDetailResponse removeTag(Long applicationId, Long tagId, Long actorId) {
        Application application = loadApplication(applicationId);
        ApplicantTag tag = applicantTagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant tag not found."));
        if (applicationTagRepository.deleteLink(applicationId, tagId) > 0) {
            applicationEventService.record(
                    application,
                    "TAG_REMOVED",
                    tag.getName(),
                    null,
                    "ADMIN",
                    actorId,
                    null,
                    "{\"tagId\":" + tag.getId() + "}"
            );
        }
        return buildDetailResponse(application);
    }

    @Transactional
    public BulkApplicantOperationResponse bulkUpdate(BulkApplicantOperationRequest request, Long actorId) {
        if (request.operation() == null || request.applicationIds() == null || request.applicationIds().isEmpty()
                || request.applicationIds().size() > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bulk operations require between 1 and 100 applications.");
        }
        LinkedHashSet<Long> applicationIds = new LinkedHashSet<>(request.applicationIds());
        if (applicationIds.stream().anyMatch(id -> id == null || id <= 0)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Bulk operations contain an invalid application ID.");
        }
        List<Application> applications = applicationRepository.findAllForAdminBulk(applicationIds);
        if (applications.size() != applicationIds.size()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "One or more applications were not found.");
        }
        AdminAccount actor = loadActiveAdmin(actorId);

        int changed = switch (request.operation()) {
            case ASSIGN -> bulkAssign(applications, request.adminAccountId(), actorId);
            case ADD_TAG -> bulkAddTag(applications, request.tagName(), actor);
            case REMOVE_TAG -> bulkRemoveTag(applications, request.tagId(), actorId);
        };
        return new BulkApplicantOperationResponse(request.operation(), applicationIds.size(), changed);
    }

    private int bulkAssign(List<Application> applications, Long assigneeId, Long actorId) {
        AdminAccount assignee = assigneeId == null ? null : loadActiveAdmin(assigneeId);
        int changed = 0;
        for (Application application : applications) {
            AdminAccount previous = application.getAssignedAdmin();
            if (sameAdmin(previous, assignee)) continue;
            application.assignTo(assignee);
            applicationEventService.record(
                    application,
                    "ASSIGNEE_CHANGED",
                    adminId(previous),
                    adminId(assignee),
                    "ADMIN",
                    actorId,
                    "Bulk assignment",
                    "{\"bulk\":true}"
            );
            changed++;
        }
        return changed;
    }

    private int bulkAddTag(List<Application> applications, String suppliedName, AdminAccount actor) {
        String name = normalizeTagName(suppliedName);
        String normalizedName = name.toLowerCase(Locale.ROOT);
        applicantTagRepository.createIfAbsent(name, normalizedName, actor.getId());
        ApplicantTag tag = applicantTagRepository.findByNormalizedName(normalizedName)
                .orElseThrow(() -> new IllegalStateException("Applicant tag was not created."));
        int changed = 0;
        for (Application application : applications) {
            if (applicationTagRepository.existsByApplicationIdAndTagId(application.getId(), tag.getId())) continue;
            applicationTagRepository.save(new ApplicationTag(application, tag, actor));
            applicationEventService.record(
                    application,
                    "TAG_ADDED",
                    null,
                    tag.getName(),
                    "ADMIN",
                    actor.getId(),
                    "Bulk tag operation",
                    "{\"tagId\":" + tag.getId() + ",\"bulk\":true}"
            );
            changed++;
        }
        return changed;
    }

    private int bulkRemoveTag(List<Application> applications, Long tagId, Long actorId) {
        if (tagId == null || tagId <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A tag is required for bulk removal.");
        }
        ApplicantTag tag = applicantTagRepository.findById(tagId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant tag not found."));
        int changed = 0;
        for (Application application : applications) {
            if (applicationTagRepository.deleteLink(application.getId(), tagId) == 0) continue;
            applicationEventService.record(
                    application,
                    "TAG_REMOVED",
                    tag.getName(),
                    null,
                    "ADMIN",
                    actorId,
                    "Bulk tag operation",
                    "{\"tagId\":" + tag.getId() + ",\"bulk\":true}"
            );
            changed++;
        }
        return changed;
    }

    private Application loadApplication(Long applicationId) {
        return applicationRepository.findWithJobPostingById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));
    }

    private AdminAccount loadActiveAdmin(Long adminId) {
        AdminAccount account = adminAccountRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin account not found."));
        if (!account.isActive()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Inactive administrators cannot be assigned.");
        }
        return account;
    }

    private void validateReviewTransition(Application application, ApplicationReviewStatus targetStatus) {
        if (application.getStatus() != ApplicationStatus.SUBMITTED && targetStatus != ApplicationReviewStatus.NEW) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can change review status.");
        }
        ApplicationReviewStatus currentStatus = application.getReviewStatus();
        if (currentStatus == targetStatus) return;
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

    private Sort buildSort(AdminApplicantSortField sortField, AdminSortDirection sortDirection) {
        AdminApplicantSortField field = sortField == null ? AdminApplicantSortField.SUBMITTED_AT : sortField;
        AdminSortDirection direction = sortDirection == null ? AdminSortDirection.DESC : sortDirection;
        String property = switch (field) {
            case SUBMITTED_AT -> "submittedAt";
            case APPLICANT_NAME -> "applicantName";
            case REVIEWED_AT -> "reviewedAt";
            case UPDATED_AT -> "updatedAt";
        };
        Sort.Order primary = new Sort.Order(Sort.Direction.valueOf(direction.name()), property).nullsLast();
        if (field == AdminApplicantSortField.APPLICANT_NAME) {
            primary = primary.ignoreCase();
        }
        return Sort.by(primary, Sort.Order.desc("id"));
    }

    private Map<Long, List<AdminApplicantTagResponse>> loadTags(List<Application> applications) {
        if (applications.isEmpty()) return Map.of();
        return applicationTagRepository.findAllForApplications(applications.stream().map(Application::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        link -> link.getApplication().getId(),
                        Collectors.mapping(
                                link -> new AdminApplicantTagResponse(link.getTag().getId(), link.getTag().getName()),
                                Collectors.toList()
                        )
                ));
    }

    private AdminApplicantDetailResponse buildDetailResponse(Application application) {
        Map<String, Object> resumePayload = applicationResumeRawRepository.findById(application.getId())
                .map(raw -> raw.getPayload())
                .orElseGet(Map::of);
        List<AdminApplicantTagResponse> tags = loadTags(List.of(application)).getOrDefault(application.getId(), List.of());
        return toDetailResponse(application, resumePayload, tags);
    }

    private AdminApplicantSummaryResponse toSummaryResponse(Application application, List<AdminApplicantTagResponse> tags) {
        AdminAccount assignedAdmin = application.getAssignedAdmin();
        return new AdminApplicantSummaryResponse(
                application.getId(),
                application.getJobPosting().getId(),
                application.getJobPosting().getTitle(),
                application.getApplicantName(),
                application.getApplicantEmail(),
                application.getApplicantPhone(),
                application.getStatus(),
                application.getReviewStatus(),
                assignedAdmin == null ? null : assignedAdmin.getId(),
                assignedAdmin == null ? null : assignedAdmin.getDisplayName(),
                tags,
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                application.getWithdrawnAt(),
                application.getWithdrawalReason()
        );
    }

    private AdminApplicantDetailResponse toDetailResponse(
            Application application,
            Map<String, Object> resumePayload,
            List<AdminApplicantTagResponse> tags
    ) {
        Long applicationId = application.getId();
        List<ResumeEducationDto> educations = resumeNormalizationService.getEducations(applicationId);
        List<ResumeExperienceDto> experiences = resumeNormalizationService.getExperiences(applicationId);
        List<ResumeSkillDto> skills = resumeNormalizationService.getSkills(applicationId);
        List<ResumeCertificationDto> certifications = resumeNormalizationService.getCertifications(applicationId);
        List<ResumeLanguageDto> languages = resumeNormalizationService.getLanguages(applicationId);
        AdminAccount assignedAdmin = application.getAssignedAdmin();

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
                assignedAdmin == null ? null : assignedAdmin.getId(),
                assignedAdmin == null ? null : assignedAdmin.getDisplayName(),
                tags,
                application.getReviewNote(),
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                application.getFinalStatus(),
                application.getFinalDecidedAt(),
                application.getFinalNote(),
                application.getWithdrawnAt(),
                application.getWithdrawalReason(),
                resumePayload,
                educations,
                experiences,
                skills,
                certifications,
                languages
        );
    }

    private boolean sameAdmin(AdminAccount first, AdminAccount second) {
        return first == null ? second == null : second != null && first.getId().equals(second.getId());
    }

    private String adminId(AdminAccount account) {
        return account == null ? null : account.getId().toString();
    }

    private String normalizeTagName(String value) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty() || normalized.length() > 80
                || !normalized.matches("^[\\p{L}\\p{N}][\\p{L}\\p{N} _./+\\-]*$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid applicant tag name.");
        }
        return normalized;
    }

    private String normalizeQuery(String query) {
        if (query == null) return null;
        String normalized = query.trim().toLowerCase(Locale.ROOT);
        return normalized.isEmpty() ? null : normalized;
    }

    private String normalizeFilterValue(String query) {
        String normalized = normalizeQuery(query);
        return normalized == null ? "" : escapeLikeValue(normalized);
    }

    private String escapeLikeValue(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }

    private String normalizeReviewNote(String reviewNote) {
        if (reviewNote == null) return null;
        String normalized = reviewNote.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    private int normalizePage(Integer page) {
        return page == null || page < 1 ? 1 : page;
    }

    private int normalizePageSize(Integer size) {
        return size == null || size < 1 ? DEFAULT_PAGE_SIZE : Math.min(size, MAX_PAGE_SIZE);
    }
}
