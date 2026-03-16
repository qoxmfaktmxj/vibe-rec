package com.viberec.api.admin.interview.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.auth.web.AdminSessionResponse;
import com.viberec.api.admin.interview.service.AdminInterviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class AdminInterviewController {

    private final AdminAuthService adminAuthService;
    private final AdminInterviewService adminInterviewService;

    public AdminInterviewController(
            AdminAuthService adminAuthService,
            AdminInterviewService adminInterviewService
    ) {
        this.adminAuthService = adminAuthService;
        this.adminInterviewService = adminInterviewService;
    }

    @PostMapping("/admin/applicants/{id}/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewResponse createInterview(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody CreateInterviewRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.createInterview(id, request);
    }

    @GetMapping("/admin/applicants/{id}/interviews")
    public List<InterviewResponse> getInterviews(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminInterviewService.getInterviews(id);
    }

    @PatchMapping("/admin/interviews/{id}")
    public InterviewResponse updateInterview(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody UpdateInterviewRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.updateInterview(id, request);
    }

    @PostMapping("/admin/interviews/{id}/evaluations")
    @ResponseStatus(HttpStatus.CREATED)
    public EvaluationResponse createEvaluation(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody CreateEvaluationRequest request
    ) {
        AdminSessionResponse session = authorize(sessionToken);
        return adminInterviewService.createEvaluation(id, session.adminAccountId(), request);
    }

    private AdminSessionResponse authorize(String sessionToken) {
        return adminAuthService.getSession(sessionToken);
    }
}
