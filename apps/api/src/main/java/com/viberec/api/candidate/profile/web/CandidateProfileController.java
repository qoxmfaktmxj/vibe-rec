package com.viberec.api.candidate.profile.web;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.profile.service.CandidateProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/candidate/profile")
public class CandidateProfileController {

    private final CandidateProfileService profileService;
    private final CandidateAuthService candidateAuthService;

    public CandidateProfileController(CandidateProfileService profileService, CandidateAuthService candidateAuthService) {
        this.profileService = profileService;
        this.candidateAuthService = candidateAuthService;
    }

    @GetMapping
    public ResponseEntity<CandidateProfileResponse> getProfile(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken
    ) {
        CandidateAccount account = candidateAuthService.requireActiveAccount(sessionToken);
        CandidateProfileResponse response = profileService.getProfile(account);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<Void> saveProfile(
            @RequestHeader(value = "X-Candidate-Session", required = false) String sessionToken,
            @RequestBody SaveCandidateProfileRequest request
    ) {
        CandidateAccount account = candidateAuthService.requireActiveAccount(sessionToken);
        profileService.saveProfile(account, request);
        return ResponseEntity.ok().build();
    }
}
