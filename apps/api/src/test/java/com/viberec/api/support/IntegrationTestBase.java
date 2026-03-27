package com.viberec.api.support;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class IntegrationTestBase {
    @Autowired
    protected CandidateAuthService candidateAuthService;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @BeforeEach
    void cleanExampleComCandidateData() {
        jdbcTemplate.update("delete from recruit.application where applicant_email like '%@example.com'");
        jdbcTemplate.update("delete from platform.candidate_account where normalized_email like '%@example.com'");
    }

    protected CandidateAccount createCandidateAccount(String fullName, String email, String phoneNumber) {
        var signupResponse = candidateAuthService.signup(
                new CandidateSignupRequest(
                        fullName,
                        email,
                        phoneNumber,
                        "candidate-pass"
                )
        );
        return candidateAuthService.requireActiveAccount(signupResponse.sessionToken());
    }
}
