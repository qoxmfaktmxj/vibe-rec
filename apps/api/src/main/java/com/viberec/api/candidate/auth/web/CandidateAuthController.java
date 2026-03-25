package com.viberec.api.candidate.auth.web;

import com.viberec.api.candidate.auth.service.CandidateAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
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

    public CandidateAuthController(CandidateAuthService candidateAuthService) {
        this.candidateAuthService = candidateAuthService;
    }

    @PostMapping("/signup")
    public CandidateLoginResponse signup(@Valid @RequestBody CandidateSignupRequest request) {
        return candidateAuthService.signup(request);
    }

    @PostMapping("/login")
    public CandidateLoginResponse login(@Valid @RequestBody CandidateLoginRequest request) {
        return candidateAuthService.login(request);
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
}
