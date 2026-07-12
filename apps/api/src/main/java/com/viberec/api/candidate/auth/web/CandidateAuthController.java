package com.viberec.api.candidate.auth.web;

import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.service.CandidateAccountRecoveryService;
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
@RequestMapping("/candidate/auth")
public class CandidateAuthController {

    private final CandidateAuthService candidateAuthService;
    private final CandidateAccountRecoveryService candidateAccountRecoveryService;

    public CandidateAuthController(
            CandidateAuthService candidateAuthService,
            CandidateAccountRecoveryService candidateAccountRecoveryService
    ) {
        this.candidateAuthService = candidateAuthService;
        this.candidateAccountRecoveryService = candidateAccountRecoveryService;
    }

    @PostMapping("/signup")
    public CandidateLoginResponse signup(
            @Valid @RequestBody CandidateSignupRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(value = "X-Client-Network", required = false) String clientNetwork
    ) {
        return candidateAuthService.signup(request, userAgent, clientNetwork);
    }

    @PostMapping("/login")
    public CandidateLoginResponse login(
            @Valid @RequestBody CandidateLoginRequest request,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @RequestHeader(value = "X-Client-Network", required = false) String clientNetwork
    ) {
        return candidateAuthService.login(request, userAgent, clientNetwork);
    }

    @GetMapping("/session")
    public CandidateSessionResponse getSession(@RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken) {
        return candidateAuthService.getSession(sessionToken);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken) {
        candidateAuthService.logout(sessionToken);
    }

    @GetMapping("/sessions")
    public List<CandidateAccountSessionResponse> getActiveSessions(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        return candidateAuthService.getActiveSessions(sessionToken);
    }

    @DeleteMapping("/sessions/{sessionId}")
    public CandidateSessionRevocationResponse revokeSession(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @PathVariable Long sessionId
    ) {
        return candidateAuthService.revokeSession(sessionToken, sessionId);
    }

    @DeleteMapping("/sessions/others")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void revokeOtherSessions(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        candidateAuthService.revokeOtherSessions(sessionToken);
    }

    @PatchMapping("/password")
    public CandidateLoginResponse changePassword(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @Valid @RequestBody CandidatePasswordChangeRequest request
    ) {
        return candidateAuthService.changePassword(sessionToken, request, userAgent);
    }

    @PostMapping("/email-verification")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resendEmailVerification(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        candidateAccountRecoveryService.issueEmailVerification(
                candidateAuthService.requireActiveAccount(sessionToken)
        );
    }

    @PostMapping("/email-verification/confirm")
    public CandidateEmailVerificationResponse confirmEmail(
            @Valid @RequestBody CandidateEmailVerificationConfirmRequest request
    ) {
        return new CandidateEmailVerificationResponse(
                candidateAccountRecoveryService.confirmEmail(request.token())
        );
    }

    @PostMapping("/password-reset")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void requestPasswordReset(
            @Valid @RequestBody CandidatePasswordResetRequest request,
            @RequestHeader(value = "X-Client-Network", required = false) String clientNetwork
    ) {
        candidateAccountRecoveryService.requestPasswordReset(request.email(), clientNetwork);
    }

    @PostMapping("/password-reset/confirm")
    public CandidateLoginResponse resetPassword(
            @RequestHeader(value = "User-Agent", required = false) String userAgent,
            @Valid @RequestBody CandidatePasswordResetConfirmRequest request
    ) {
        return candidateAuthService.resetPassword(request.token(), request.newPassword(), userAgent);
    }
}
