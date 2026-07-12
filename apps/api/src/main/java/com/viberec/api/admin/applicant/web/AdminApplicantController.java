package com.viberec.api.admin.applicant.web;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.service.AdminApplicantSavedSearchService;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.application.web.ApplicationEventResponse;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;

@RestController
@RequestMapping("/admin/applicants")
public class AdminApplicantController {

    private final AdminAuthService adminAuthService;
    private final AdminApplicantService adminApplicantService;
    private final ApplicationEventService applicationEventService;
    private final AdminApplicantSavedSearchService savedSearchService;

    public AdminApplicantController(
            AdminAuthService adminAuthService,
            AdminApplicantService adminApplicantService,
            ApplicationEventService applicationEventService,
            AdminApplicantSavedSearchService savedSearchService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminApplicantService = adminApplicantService;
        this.applicationEventService = applicationEventService;
        this.savedSearchService = savedSearchService;
    }

    @GetMapping
    @RequiresPermission("APPLICANT_VIEW")
    public AdminApplicantPageResponse getApplicants(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @RequestParam(required = false) Long jobPostingId,
            @RequestParam(required = false) ApplicationStatus applicationStatus,
            @RequestParam(required = false) ApplicationReviewStatus reviewStatus,
            @RequestParam(required = false) Long assignedAdminId,
            @RequestParam(required = false) Long tagId,
            @RequestParam(required = false) String applicantName,
            @RequestParam(required = false) String applicantEmail,
            @RequestParam(required = false) String applicantPhone,
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "SUBMITTED_AT") AdminApplicantSortField sort,
            @RequestParam(defaultValue = "DESC") AdminSortDirection direction,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "30") Integer size
    ) {
        authorize(sessionToken);
        return adminApplicantService.getApplicantsPage(
                jobPostingId,
                applicationStatus,
                reviewStatus,
                assignedAdminId,
                tagId,
                applicantName,
                applicantEmail,
                applicantPhone,
                query,
                sort,
                direction,
                page,
                size
        );
    }

    @GetMapping("/options")
    @RequiresPermission("APPLICANT_VIEW")
    public AdminApplicantOptionsResponse getApplicantOptions(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken
    ) {
        authorize(sessionToken);
        return adminApplicantService.getApplicantOptions();
    }

    @GetMapping("/saved-searches")
    @RequiresPermission("APPLICANT_VIEW")
    public List<AdminApplicantSavedSearchResponse> getSavedSearches(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return savedSearchService.getSavedSearches(session.adminAccountId());
    }

    @PostMapping("/saved-searches")
    @RequiresPermission("APPLICANT_VIEW")
    public AdminApplicantSavedSearchResponse createSavedSearch(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @Valid @RequestBody CreateAdminApplicantSavedSearchRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return savedSearchService.create(session.adminAccountId(), request);
    }

    @DeleteMapping("/saved-searches/{savedSearchId}")
    @RequiresPermission("APPLICANT_VIEW")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSavedSearch(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long savedSearchId
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        savedSearchService.delete(session.adminAccountId(), savedSearchId);
    }

    @PostMapping("/bulk")
    @RequiresPermission("APPLICANT_REVIEW")
    public BulkApplicantOperationResponse bulkUpdate(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @Valid @RequestBody BulkApplicantOperationRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminApplicantService.bulkUpdate(request, session.adminAccountId());
    }

    @GetMapping("/{id}")
    @RequiresPermission("APPLICANT_VIEW")
    public AdminApplicantDetailResponse getApplicant(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminApplicantService.getApplicant(id);
    }

    @PatchMapping("/{id}/review-status")
    @RequiresPermission("APPLICANT_REVIEW")
    public AdminApplicantDetailResponse updateReviewStatus(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicantReviewStatusRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminApplicantService.updateReviewStatus(id, request, "ADMIN", session.adminAccountId());
    }

    @PatchMapping("/{id}/assignee")
    @RequiresPermission("APPLICANT_REVIEW")
    public AdminApplicantDetailResponse updateAssignee(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id,
            @RequestBody UpdateApplicantAssigneeRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminApplicantService.updateAssignee(id, request, session.adminAccountId());
    }

    @PostMapping("/{id}/tags")
    @RequiresPermission("APPLICANT_REVIEW")
    public AdminApplicantDetailResponse addTag(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody AddApplicantTagRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminApplicantService.addTag(id, request, session.adminAccountId());
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    @RequiresPermission("APPLICANT_REVIEW")
    public AdminApplicantDetailResponse removeTag(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id,
            @PathVariable Long tagId
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminApplicantService.removeTag(id, tagId, session.adminAccountId());
    }

    @GetMapping("/{id}/events")
    @RequiresPermission("APPLICANT_VIEW")
    public List<ApplicationEventResponse> getApplicationEvents(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return applicationEventService.getEvents(id);
    }

    private AdminSessionResponse authorize(String sessionToken) {
        return adminAuthService.getSession(sessionToken);
    }
}
