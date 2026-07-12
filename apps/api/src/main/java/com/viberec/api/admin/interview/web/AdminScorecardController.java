package com.viberec.api.admin.interview.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.admin.interview.service.AdminScorecardService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/job-postings/{jobPostingId}/steps/{stepId}/scorecard")
public class AdminScorecardController {

    private final AdminAuthService adminAuthService;
    private final AdminScorecardService adminScorecardService;

    public AdminScorecardController(AdminAuthService adminAuthService, AdminScorecardService adminScorecardService) {
        this.adminAuthService = adminAuthService;
        this.adminScorecardService = adminScorecardService;
    }

    @GetMapping
    @RequiresPermission("JOB_POSTING_VIEW")
    public List<ScorecardCriterionResponse> getCriteria(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long jobPostingId,
            @PathVariable Long stepId
    ) {
        adminAuthService.getSession(sessionToken);
        return adminScorecardService.getCriteria(jobPostingId, stepId);
    }

    @PutMapping
    @RequiresPermission("JOB_POSTING_MANAGE")
    public List<ScorecardCriterionResponse> replaceCriteria(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long jobPostingId,
            @PathVariable Long stepId,
            @Valid @RequestBody ReplaceScorecardCriteriaRequest request
    ) {
        adminAuthService.getSession(sessionToken);
        return adminScorecardService.replaceCriteria(jobPostingId, stepId, request);
    }
}
