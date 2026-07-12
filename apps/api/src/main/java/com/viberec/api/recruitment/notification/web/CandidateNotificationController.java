package com.viberec.api.recruitment.notification.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.recruitment.notification.service.CandidateNotificationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidate/notifications")
public class CandidateNotificationController {

    private final CandidateAuthService candidateAuthService;
    private final CandidateNotificationService candidateNotificationService;

    public CandidateNotificationController(
            CandidateAuthService candidateAuthService,
            CandidateNotificationService candidateNotificationService
    ) {
        this.candidateAuthService = candidateAuthService;
        this.candidateNotificationService = candidateNotificationService;
    }

    @GetMapping
    public List<CandidateNotificationResponse> getNotifications(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateNotificationService.getNotifications(candidateAccount);
    }

    @PatchMapping("/{id}/read")
    public CandidateNotificationResponse markRead(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateNotificationService.markRead(id, candidateAccount);
    }
}
