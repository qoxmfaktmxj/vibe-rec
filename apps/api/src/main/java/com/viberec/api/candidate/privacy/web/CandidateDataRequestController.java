package com.viberec.api.candidate.privacy.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.privacy.service.CandidateDataRequestService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidate/data-requests")
public class CandidateDataRequestController {

    private final CandidateAuthService candidateAuthService;
    private final CandidateDataRequestService candidateDataRequestService;

    public CandidateDataRequestController(
            CandidateAuthService candidateAuthService,
            CandidateDataRequestService candidateDataRequestService
    ) {
        this.candidateAuthService = candidateAuthService;
        this.candidateDataRequestService = candidateDataRequestService;
    }

    @GetMapping
    public List<CandidateDataRequestResponse> getRequests(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateDataRequestService.getRequests(candidateAccount);
    }

    @PostMapping
    public CandidateDataRequestResponse createRequest(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @Valid @RequestBody CreateCandidateDataRequest request
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateDataRequestService.create(candidateAccount, request);
    }

    @DeleteMapping("/{id}")
    public CandidateDataRequestResponse cancelRequest(
            @PathVariable Long id,
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount candidateAccount = candidateAuthService.requireActiveAccount(sessionToken);
        return candidateDataRequestService.cancel(id, candidateAccount);
    }
}
