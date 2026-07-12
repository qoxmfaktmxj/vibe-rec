package com.viberec.api.admin.privacy.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.admin.privacy.service.AdminCandidateDataRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/data-requests")
public class AdminCandidateDataRequestController {

    private final AdminAuthService adminAuthService;
    private final AdminCandidateDataRequestService dataRequestService;

    public AdminCandidateDataRequestController(
            AdminAuthService adminAuthService,
            AdminCandidateDataRequestService dataRequestService
    ) {
        this.adminAuthService = adminAuthService;
        this.dataRequestService = dataRequestService;
    }

    @GetMapping
    @RequiresPermission("DATA_PRIVACY_MANAGE")
    public List<AdminCandidateDataRequestResponse> getRequests(
            @RequestHeader("X-Admin-Session") String sessionToken
    ) {
        authorize(sessionToken);
        return dataRequestService.getRequests();
    }

    @PatchMapping("/{id}")
    @RequiresPermission("DATA_PRIVACY_MANAGE")
    public AdminCandidateDataRequestResponse updateRequest(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody UpdateCandidateDataRequestRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return dataRequestService.update(id, session.adminAccountId(), request);
    }

    private AdminSessionResponse authorize(String sessionToken) {
        return adminAuthService.getSession(sessionToken);
    }
}
