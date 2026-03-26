package com.viberec.api.admin.interview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.interview.service.AdminInterviewService;
import com.viberec.api.admin.interview.web.CreateEvaluationRequest;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.admin.interview.web.UpdateInterviewRequest;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.evaluation.domain.EvaluationResult;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
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
    @Autowired private AdminAccountRepository adminAccountRepository;
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

        var step = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(jobPostingStep -> jobPostingStep.getStepType() == JobPostingStepType.INTERVIEW)
                .findFirst()
                .orElseThrow();
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

    @Test
    void rejectsNonInterviewStepsAndPrematureEvaluations() {
        CandidateAccount candidate = registerCandidate("Flow Kim", "flow.kim@example.com", "010-9090-0000");
        Long applicationId = applicationDraftService.submit(1001L, candidate, new SaveApplicationDraftRequest(Map.of(
                "introduction", "I have implemented hiring workflow boundaries and interview lifecycle checks.",
                "coreStrength", "I enforce backend invariants before relying on the UI."
        ), null, null, null, null, null)).applicationId();

        var documentStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepOrder() == 1)
                .findFirst()
                .orElseThrow();

        assertThatThrownBy(() -> adminInterviewService.createInterview(
                applicationId,
                new CreateInterviewRequest(documentStep.getId(), null, null, "Should fail")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        var interviewStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepOrder() == 2)
                .findFirst()
                .orElseThrow();

        var interview = adminInterviewService.createInterview(
                applicationId,
                new CreateInterviewRequest(interviewStep.getId(), null, null, "Actual interview")
        );

        Long evaluatorId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        assertThatThrownBy(() -> adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest((short) 4, "Too early", EvaluationResult.PASS)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        adminInterviewService.updateInterview(
                interview.id(),
                new UpdateInterviewRequest(InterviewStatus.COMPLETED, "Completed")
        );

        var evaluation = adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest((short) 4, "Ready now", EvaluationResult.PASS)
        );
        var interviews = adminInterviewService.getInterviews(applicationId);

        assertThat(evaluation.interviewId()).isEqualTo(interview.id());
        assertThat(evaluation.result()).isEqualTo(EvaluationResult.PASS);
        assertThat(interviews)
                .singleElement()
                .extracting(response -> response.evaluations().getFirst().evaluatorName())
                .isEqualTo("Dev Admin");
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
