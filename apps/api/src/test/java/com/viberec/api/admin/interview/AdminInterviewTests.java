package com.viberec.api.admin.interview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.interview.service.AdminInterviewService;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AdminInterviewTests extends IntegrationTestBase {

    @Autowired private AdminInterviewService adminInterviewService;
    @Autowired private ApplicationDraftService applicationDraftService;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationResumeRawRepository applicationResumeRawRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private JobPostingStepRepository jobPostingStepRepository;
    @Autowired private CandidateAuthService candidateAuthService;
    @Autowired private CandidateSessionRepository candidateSessionRepository;
    @Autowired private CandidateAccountRepository candidateAccountRepository;

    @BeforeEach
    void cleanApplications() {
        interviewRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void createsInterviewFromStepOrderWhenStepIdIsNotProvided() {
        CandidateAccount candidate = registerCandidate("Interview Kim", "interview.kim@example.com", "010-1010-2020");
        Long applicationId = applicationDraftService.submit(1001L, candidate, new SaveApplicationDraftRequest(Map.of(
                "introduction", "I have coordinated recruiter interviews and candidate pipelines across several teams.",
                "coreStrength", "I can turn evolving hiring steps into stable, testable workflows."
        ), null, null, null, null, null)).applicationId();

        var step = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).getFirst();
        var response = adminInterviewService.createInterview(applicationId, new CreateInterviewRequest(null, step.getStepOrder(), null, "Create from step order"));

        assertThat(response.applicationId()).isEqualTo(applicationId);
        assertThat(response.jobPostingStepId()).isEqualTo(step.getId());
    }

    @Test
    void rejectsInterviewStepFromAnotherJobPosting() {
        CandidateAccount candidate = registerCandidate("Mismatch Kim", "mismatch.kim@example.com", "010-3030-4040");
        Long applicationId = applicationDraftService.submit(1001L, candidate, new SaveApplicationDraftRequest(Map.of(
                "introduction", "I have reviewed recruiting workflows with cross-posting edge cases.",
                "coreStrength", "I look for contract mismatches between admin tooling and backend rules."
        ), null, null, null, null, null)).applicationId();

        var foreignStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1002L).getFirst();

        assertThatThrownBy(() -> adminInterviewService.createInterview(
                applicationId,
                new CreateInterviewRequest(foreignStep.getId(), null, null, "Should fail")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
