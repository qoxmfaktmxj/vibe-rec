package com.viberec.api.recruitment.application.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidate/applications")
public class CandidateApplicationController {

    private final CandidateApplicationQueryService candidateApplicationQueryService;
    private final CandidateAuthService candidateAuthService;

    public CandidateApplicationController(
            CandidateApplicationQueryService candidateApplicationQueryService,
            CandidateAuthService candidateAuthService
    ) {
        this.candidateApplicationQueryService = candidateApplicationQueryService;
        this.candidateAuthService = candidateAuthService;
    }

    @GetMapping
    public List<CandidateApplicationSummaryResponse> getCandidateApplications(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateApplicationQueryService.getCandidateApplications(candidateAccount);
    }
}
