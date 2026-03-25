package com.viberec.api.support;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class IntegrationTestBase {

    @Autowired
    protected CandidateAuthService candidateAuthService;

    protected CandidateAccount createCandidateAccount(String fullName, String email, String phoneNumber) {
        var signupResponse = candidateAuthService.signup(
                new CandidateSignupRequest(fullName, email, phoneNumber, "candidate-pass")
        );
        return candidateAuthService.requireActiveAccount(signupResponse.sessionToken());
    }
}
