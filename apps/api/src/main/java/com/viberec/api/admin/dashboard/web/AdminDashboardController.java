package com.viberec.api.admin.dashboard.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.RequiresPermission;
import com.viberec.api.admin.dashboard.service.AdminDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")
public class AdminDashboardController {

    private final AdminAuthService adminAuthService;
    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminAuthService adminAuthService, AdminDashboardService adminDashboardService) {
        this.adminAuthService = adminAuthService;
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    @RequiresPermission("APPLICANT_VIEW")
    public AdminDashboardResponse getDashboard(
            @RequestHeader(value = "X-Admin-Session", required = false) String sessionToken
    ) {
        adminAuthService.getSession(sessionToken);
        return adminDashboardService.getDashboard();
    }
}
