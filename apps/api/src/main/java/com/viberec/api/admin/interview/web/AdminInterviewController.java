package com.viberec.api.admin.interview.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.admin.interview.service.AdminInterviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
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

    // 지원자의 면접 목록 조회
    @GetMapping("/admin/applicants/{id}/interviews")
    public List<InterviewResponse> getInterviews(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id
    ) {
        authorize(sessionToken);
        return adminInterviewService.getInterviews(id);
    }

    // 면접 일정 등록
    @PostMapping("/admin/applicants/{id}/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewResponse scheduleInterview(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long id,
            @Valid @RequestBody ScheduleInterviewRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.scheduleInterview(id, request);
    }

    // 면접 상태 변경
    @PatchMapping("/admin/interviews/{interviewId}/status")
    public InterviewResponse updateStatus(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long interviewId,
            @Valid @RequestBody UpdateInterviewStatusRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.updateStatus(interviewId, request);
    }

    // 평가자 추가
    @PostMapping("/admin/interviews/{interviewId}/evaluators")
    @ResponseStatus(HttpStatus.CREATED)
    public InterviewResponse addEvaluator(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long interviewId,
            @Valid @RequestBody AddEvaluatorRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.addEvaluator(interviewId, request);
    }

    // 평가자 삭제
    @DeleteMapping("/admin/interviews/{interviewId}/evaluators/{evaluatorId}")
    public InterviewResponse removeEvaluator(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long interviewId,
            @PathVariable Long evaluatorId
    ) {
        authorize(sessionToken);
        return adminInterviewService.removeEvaluator(interviewId, evaluatorId);
    }

    // 평가 점수 제출
    @PatchMapping("/admin/interviews/{interviewId}/evaluators/{evaluatorId}/score")
    public InterviewResponse submitEvaluation(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @PathVariable Long interviewId,
            @PathVariable Long evaluatorId,
            @Valid @RequestBody SubmitEvaluationRequest request
    ) {
        authorize(sessionToken);
        return adminInterviewService.submitEvaluation(interviewId, evaluatorId, request);
    }

    private void authorize(String sessionToken) {
        adminAuthService.getSession(sessionToken);
    }
}
