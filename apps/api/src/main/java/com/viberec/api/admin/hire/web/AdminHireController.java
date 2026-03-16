package com.viberec.api.admin.hire.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.hire.service.AdminHireService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Optional;
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
@RequestMapping("/admin")
public class AdminHireController {

    private final AdminAuthService adminAuthService;
    private final AdminHireService adminHireService;

    public AdminHireController(AdminAuthService adminAuthService, AdminHireService adminHireService) {
        this.adminAuthService = adminAuthService;
        this.adminHireService = adminHireService;
    }

    // 최종 결정 등록
    @PostMapping("/applicants/{id}/hire-decision")
    @ResponseStatus(HttpStatus.CREATED)
    public HireDecisionResponse createDecision(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody CreateHireDecisionRequest request
    ) {
        authorize(sessionToken);
        return adminHireService.createDecision(id, request);
    }

    // 최종 결정 조회
    @GetMapping("/applicants/{id}/hire-decision")
    public Optional<HireDecisionResponse> getDecision(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminHireService.getDecision(id);
    }

    // 통지 템플릿 목록
    @GetMapping("/notification-templates")
    public List<NotificationTemplateResponse> getTemplates(
            @RequestHeader("X-Admin-Session") String sessionToken
    ) {
        authorize(sessionToken);
        return adminHireService.getTemplates();
    }

    // 통지 미리보기
    @GetMapping("/applicants/{id}/notifications/preview/{templateId}")
    public NotificationPreviewResponse previewNotification(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @PathVariable Long templateId
    ) {
        authorize(sessionToken);
        return adminHireService.previewNotification(id, templateId);
    }

    // 통지 발송
    @PostMapping("/applicants/{id}/notifications/send/{templateId}")
    @ResponseStatus(HttpStatus.CREATED)
    public NotificationLogResponse sendNotification(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @PathVariable Long templateId
    ) {
        authorize(sessionToken);
        return adminHireService.sendNotification(id, templateId);
    }

    // 발송 이력 조회
    @GetMapping("/applicants/{id}/notifications")
    public List<NotificationLogResponse> getNotificationHistory(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminHireService.getNotificationHistory(id);
    }

    private void authorize(String sessionToken) {
        adminAuthService.getSession(sessionToken);
    }
}
