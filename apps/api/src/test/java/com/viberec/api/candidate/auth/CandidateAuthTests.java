package com.viberec.api.candidate.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateLoginRequest;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.support.IntegrationTestBase;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class CandidateAuthTests extends IntegrationTestBase {

    @Autowired
    private CandidateAuthService candidateAuthService;

    @Autowired
    private CandidateAccountRepository candidateAccountRepository;

    @Autowired
    private CandidateSessionRepository candidateSessionRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @BeforeEach
    void cleanCandidateAuth() {
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void signsUpAndResolvesCandidateSession() {
        var response = candidateAuthService.signup(
                new CandidateSignupRequest("Candidate Kim", "candidate@example.com", "010-1234-5678", "password123")
        );

        assertThat(response.email()).isEqualTo("candidate@example.com");
        assertThat(response.name()).isEqualTo("Candidate Kim");
        assertThat(response.sessionToken()).isNotBlank();

        var session = candidateAuthService.getSession(response.sessionToken());
        assertThat(session.email()).isEqualTo("candidate@example.com");
        assertThat(session.phone()).isEqualTo("010-1234-5678");
    }

    @Test
    void logsInAndLogsOutCandidateAccount() {
        candidateAuthService.signup(new CandidateSignupRequest("Login Kim", "login@example.com", "010-2222-3333", "password123"));

        var login = candidateAuthService.login(new CandidateLoginRequest("login@example.com", "password123"));
        assertThat(login.sessionToken()).isNotBlank();

        candidateAuthService.logout(login.sessionToken());

        assertThatThrownBy(() -> candidateAuthService.getSession(login.sessionToken()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void rejectsInvalidCandidatePassword() {
        candidateAuthService.signup(new CandidateSignupRequest("Wrong Kim", "wrong@example.com", "010-4444-5555", "password123"));

        assertThatThrownBy(() -> candidateAuthService.login(new CandidateLoginRequest("wrong@example.com", "wrong-password")))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
