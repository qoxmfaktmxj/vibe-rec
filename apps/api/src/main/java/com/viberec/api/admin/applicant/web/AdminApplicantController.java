package com.viberec.api.admin.applicant.web;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/applicants")
public class AdminApplicantController {

    private final AdminAuthService adminAuthService;
    private final AdminApplicantService adminApplicantService;

    public AdminApplicantController(
            AdminAuthService adminAuthService,
            AdminApplicantService adminApplicantService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminApplicantService = adminApplicantService;
    }

    @GetMapping
    @RequiresPermission("APPLICANT_VIEW")
    public List<AdminApplicantSummaryResponse> getApplicants(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @RequestParam(required = false) Long jobPostingId,
            @RequestParam(required = false) ApplicationStatus applicationStatus,
            @RequestParam(required = false) ApplicationReviewStatus reviewStatus,
            @RequestParam(required = false) String query
    ) {
        authorize(sessionToken);
        return adminApplicantService.getApplicants(jobPostingId, applicationStatus, reviewStatus, query);
    }

    @GetMapping("/{id}")
    @RequiresPermission("APPLICANT_VIEW")
    public AdminApplicantDetailResponse getApplicant(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminApplicantService.getApplicant(id);
    }

    @PatchMapping("/{id}/review-status")
    @RequiresPermission("APPLICANT_REVIEW")
    public AdminApplicantDetailResponse updateReviewStatus(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody UpdateApplicantReviewStatusRequest request
    ) {
        authorize(sessionToken);
        return adminApplicantService.updateReviewStatus(id, request);
    }

    private void authorize(String sessionToken) {
        adminAuthService.getSession(sessionToken);
    }
}
