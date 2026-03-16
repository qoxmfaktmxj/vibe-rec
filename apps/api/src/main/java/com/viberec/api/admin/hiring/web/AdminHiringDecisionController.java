package com.viberec.api.admin.hiring.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.hiring.service.AdminHiringDecisionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/applicants/{id}")
public class AdminHiringDecisionController {

    private final AdminAuthService adminAuthService;
    private final AdminHiringDecisionService adminHiringDecisionService;

    public AdminHiringDecisionController(
            AdminAuthService adminAuthService,
            AdminHiringDecisionService adminHiringDecisionService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminHiringDecisionService = adminHiringDecisionService;
    }

    @PostMapping("/final-decision")
    @ResponseStatus(HttpStatus.OK)
    public FinalDecisionResponse makeFinalDecision(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody FinalDecisionRequest request
    ) {
        authorize(sessionToken);
        return adminHiringDecisionService.makeFinalDecision(id, request);
    }

    @PostMapping("/notifications")
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationResponse createNotification(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody CreateNotificationRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminHiringDecisionService.createNotification(id, session.adminAccountId(), request);
    }

    @GetMapping("/notifications")
    public List<NotificationResponse> getNotifications(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminHiringDecisionService.getNotifications(id);
    }

    private AdminSessionResponse authorize(String sessionToken) {
        return adminAuthService.getSession(sessionToken);
    }
}
