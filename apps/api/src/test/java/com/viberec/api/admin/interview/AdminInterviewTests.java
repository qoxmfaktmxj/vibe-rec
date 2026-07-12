package com.viberec.api.admin.interview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.within;

import com.viberec.api.admin.interview.service.AdminInterviewService;
import com.viberec.api.admin.interview.service.AdminScorecardService;
import com.viberec.api.admin.interview.web.CreateEvaluationRequest;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.admin.interview.web.EvaluationCriterionScoreRequest;
import com.viberec.api.admin.interview.web.ReplaceScorecardCriteriaRequest;
import com.viberec.api.admin.interview.web.ScorecardCriterionInput;
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
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import com.viberec.api.recruitment.application.service.CandidateApplicationCommandService;
import com.viberec.api.recruitment.application.web.WithdrawApplicationRequest;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.domain.InterviewType;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.evaluation.repository.ScorecardCriterionRepository;
import com.viberec.api.recruitment.interview.service.CandidateInterviewCalendarService;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.support.IntegrationTestBase;
import java.util.List;
import java.util.Map;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

class AdminInterviewTests extends IntegrationTestBase {

    @Autowired private AdminInterviewService adminInterviewService;
    @Autowired private AdminScorecardService adminScorecardService;
    @Autowired private ApplicationDraftService applicationDraftService;
    @Autowired private ApplicationEventService applicationEventService;
    @Autowired private CandidateApplicationQueryService candidateApplicationQueryService;
    @Autowired private CandidateApplicationCommandService candidateApplicationCommandService;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationResumeRawRepository applicationResumeRawRepository;
    @Autowired private InterviewRepository interviewRepository;
    @Autowired private ScorecardCriterionRepository scorecardCriterionRepository;
    @Autowired private CandidateInterviewCalendarService candidateInterviewCalendarService;
    @Autowired private JobPostingStepRepository jobPostingStepRepository;
    @Autowired private AdminAccountRepository adminAccountRepository;
    @Autowired private CandidateAuthService candidateAuthService;
    @Autowired private CandidateSessionRepository candidateSessionRepository;
    @Autowired private CandidateAccountRepository candidateAccountRepository;
    @Autowired private PlatformTransactionManager transactionManager;

    @BeforeEach
    void cleanApplications() {
        interviewRepository.deleteAll();
        scorecardCriterionRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void createsInterviewFromStepOrderWhenStepIdIsNotProvided() {
        CandidateAccount candidate = registerCandidate("Interview Kim", "interview.kim@example.com", "010-1010-2020");
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have coordinated recruiter interviews and candidate pipelines across several teams.",
                "coreStrength", "I can turn evolving hiring steps into stable, testable workflows."
        ))).applicationId();

        var step = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(jobPostingStep -> jobPostingStep.getStepType() == JobPostingStepType.INTERVIEW)
                .findFirst()
                .orElseThrow();
        var response = adminInterviewService.createInterview(
                applicationId,
                videoInterview(null, step.getStepOrder(), "Create from step order")
        );

        assertThat(response.applicationId()).isEqualTo(applicationId);
        assertThat(response.jobPostingStepId()).isEqualTo(step.getId());
        assertThat(response.interviewType()).isEqualTo(InterviewType.VIDEO);
        assertThat(response.durationMinutes()).isEqualTo(60);
        assertThat(response.onlineLink()).isEqualTo("https://meet.example.com/interview");

        var candidateView = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);
        assertThat(candidateView.interviews())
                .singleElement()
                .satisfies(interview -> {
                    assertThat(interview.stepTitle()).isEqualTo(step.getTitle());
                    assertThat(interview.onlineLink()).isEqualTo("https://meet.example.com/interview");
                });

        var calendar = candidateInterviewCalendarService.createCalendar(applicationId, response.id(), candidate);
        assertThat(new String(calendar.content(), java.nio.charset.StandardCharsets.UTF_8))
                .contains("BEGIN:VCALENDAR", "DTSTART:", "URL:https://meet.example.com/interview");

        CandidateAccount otherCandidate = registerCandidate("Other Kim", "other.interview@example.com", "010-2020-3030");
        assertThatThrownBy(() -> candidateInterviewCalendarService.createCalendar(
                applicationId,
                response.id(),
                otherCandidate
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void rejectsInterviewStepFromAnotherJobPosting() {
        CandidateAccount candidate = registerCandidate("Mismatch Kim", "mismatch.kim@example.com", "010-3030-4040");
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have reviewed recruiting workflows with cross-posting edge cases.",
                "coreStrength", "I look for contract mismatches between admin tooling and backend rules."
        ))).applicationId();

        var foreignStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1002L).getFirst();

        assertThatThrownBy(() -> adminInterviewService.createInterview(
                applicationId,
                videoInterview(foreignStep.getId(), null, "Should fail")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsNonInterviewStepsAndPrematureEvaluations() {
        CandidateAccount candidate = registerCandidate("Flow Kim", "flow.kim@example.com", "010-9090-0000");
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have implemented hiring workflow boundaries and interview lifecycle checks.",
                "coreStrength", "I enforce backend invariants before relying on the UI."
        ))).applicationId();

        var documentStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepOrder() == 1)
                .findFirst()
                .orElseThrow();

        assertThatThrownBy(() -> adminInterviewService.createInterview(
                applicationId,
                videoInterview(documentStep.getId(), null, "Should fail")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        var interviewStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepOrder() == 2)
                .findFirst()
                .orElseThrow();
        var scorecard = adminScorecardService.replaceCriteria(
                1001L,
                interviewStep.getId(),
                new ReplaceScorecardCriteriaRequest(List.of(
                        new ScorecardCriterionInput("Technical depth", "Role-specific expertise", (short) 70, true),
                        new ScorecardCriterionInput("Communication", "Clear collaboration", (short) 30, true)
                ))
        );

        var interview = adminInterviewService.createInterview(
                applicationId,
                videoInterview(interviewStep.getId(), null, "Actual interview")
        );
        var scheduledProgress = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);
        assertThat(scheduledProgress.candidateVisibleStage().name()).isEqualTo("INTERVIEW");
        assertThat(scheduledProgress.nextAction().name()).isEqualTo("PREPARE_FOR_INTERVIEW");

        Long evaluatorId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        assertThatThrownBy(() -> adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest(
                        List.of(
                                new EvaluationCriterionScoreRequest(scorecard.get(0).id(), (short) 5, "Strong"),
                                new EvaluationCriterionScoreRequest(scorecard.get(1).id(), (short) 3, "Clear")
                        ),
                        "Too early",
                        EvaluationResult.PASS
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        adminInterviewService.updateInterview(
                interview.id(),
                new UpdateInterviewRequest(InterviewStatus.COMPLETED, "Completed")
        );

        assertThatThrownBy(() -> adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest(
                        List.of(new EvaluationCriterionScoreRequest(scorecard.get(0).id(), (short) 5, null)),
                        "Missing a required criterion",
                        EvaluationResult.PASS
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        assertThatThrownBy(() -> adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest(
                        List.of(new EvaluationCriterionScoreRequest(999999999L, (short) 5, null)),
                        "Foreign criterion",
                        EvaluationResult.PASS
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);

        var evaluation = adminInterviewService.createEvaluation(
                interview.id(),
                evaluatorId,
                new CreateEvaluationRequest(
                        List.of(
                                new EvaluationCriterionScoreRequest(scorecard.get(0).id(), (short) 5, "Excellent depth"),
                                new EvaluationCriterionScoreRequest(scorecard.get(1).id(), (short) 3, "Good communication")
                        ),
                        "Ready now",
                        EvaluationResult.PASS
                )
        );
        var interviews = adminInterviewService.getInterviews(applicationId);

        assertThat(evaluation.interviewId()).isEqualTo(interview.id());
        assertThat(evaluation.result()).isEqualTo(EvaluationResult.PASS);
        assertThat(evaluation.score()).isEqualTo((short) 4);
        assertThat(evaluation.criterionScores()).hasSize(2);
        assertThat(interviews)
                .singleElement()
                .extracting(response -> response.evaluations().getFirst().evaluatorName())
                .isEqualTo("Dev Admin");

        assertThatThrownBy(() -> adminScorecardService.replaceCriteria(
                1001L,
                interviewStep.getId(),
                new ReplaceScorecardCriteriaRequest(List.of(
                        new ScorecardCriterionInput("Changed", null, (short) 100, true)
                ))
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        var completedProgress = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);
        assertThat(completedProgress.nextAction().name()).isEqualTo("WAIT_FOR_DECISION");
        assertThat(applicationEventService.getEvents(applicationId))
                .extracting("eventType")
                .contains(
                        "APPLICATION_SUBMITTED",
                        "INTERVIEW_SCHEDULED",
                        "INTERVIEW_STATUS_CHANGED",
                        "EVALUATION_CREATED"
                );
    }

    @Test
    void withdrawsApplicationAndCancelsScheduledInterviewAtomically() {
        CandidateAccount candidate = registerCandidate("Withdraw Kim", "withdraw.kim@example.com", "010-4545-6767");
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have managed candidate lifecycle transitions with explicit withdrawal handling.",
                "coreStrength", "I preserve auditability when active hiring work must be cancelled."
        ))).applicationId();
        var interviewStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepType() == JobPostingStepType.INTERVIEW)
                .findFirst()
                .orElseThrow();
        var interview = adminInterviewService.createInterview(
                applicationId,
                videoInterview(interviewStep.getId(), null, "Scheduled before withdrawal")
        );

        var withdrawn = candidateApplicationCommandService.withdraw(
                applicationId,
                candidate,
                new WithdrawApplicationRequest("Accepted another opportunity.")
        );
        var replay = candidateApplicationCommandService.withdraw(
                applicationId,
                candidate,
                new WithdrawApplicationRequest("This replay must remain idempotent.")
        );

        assertThat(withdrawn.status().name()).isEqualTo("WITHDRAWN");
        assertThat(replay.withdrawnAt()).isCloseTo(
                withdrawn.withdrawnAt(),
                within(1, ChronoUnit.MILLIS)
        );
        assertThat(replay.withdrawalReason()).isEqualTo("Accepted another opportunity.");
        assertThat(interviewRepository.findById(interview.id()).orElseThrow().getStatus())
                .isEqualTo(InterviewStatus.CANCELLED);
        var candidateView = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);
        assertThat(candidateView.candidateVisibleStage().name()).isEqualTo("CLOSED");
        assertThat(candidateView.nextAction().name()).isEqualTo("NONE");
        assertThat(candidateView.withdrawalReason()).isEqualTo("Accepted another opportunity.");
        assertThat(applicationEventService.getEvents(applicationId))
                .extracting("eventType")
                .contains("APPLICATION_WITHDRAWN", "INTERVIEW_STATUS_CHANGED");
    }

    @Test
    void preventsInterviewCreationAfterConcurrentWithdrawal() throws Exception {
        CandidateAccount candidate = registerCandidate(
                "Concurrent Withdraw Kim",
                "withdraw.race@example.com",
                "010-7878-8989"
        );
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I coordinate concurrent recruiting commands without leaving inconsistent schedules.",
                "coreStrength", "I protect workflow state transitions with explicit transaction boundaries."
        ))).applicationId();
        var interviewStep = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).stream()
                .filter(step -> step.getStepType() == JobPostingStepType.INTERVIEW)
                .findFirst()
                .orElseThrow();
        var lockAcquired = new CountDownLatch(1);
        var releaseLock = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        try {
            var withdrawal = executor.submit(() -> {
                new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
                    var application = applicationRepository
                            .findOwnedForCommandById(applicationId, candidate.getId())
                            .orElseThrow();
                    application.withdraw("Concurrent withdrawal");
                    lockAcquired.countDown();
                    await(releaseLock);
                });
                return null;
            });
            assertThat(lockAcquired.await(5, TimeUnit.SECONDS)).isTrue();

            var scheduling = executor.submit(() -> adminInterviewService.createInterview(
                    applicationId,
                    videoInterview(interviewStep.getId(), null, "Must observe withdrawal")
            ));
            assertThatThrownBy(() -> scheduling.get(250, TimeUnit.MILLISECONDS))
                    .isInstanceOf(TimeoutException.class);

            releaseLock.countDown();
            withdrawal.get(5, TimeUnit.SECONDS);
            assertThatThrownBy(() -> scheduling.get(5, TimeUnit.SECONDS))
                    .isInstanceOf(ExecutionException.class)
                    .hasCauseInstanceOf(ResponseStatusException.class);
            assertThat(interviewRepository.findByApplicationIdOrderByCreatedAt(applicationId)).isEmpty();
        } finally {
            releaseLock.countDown();
            executor.shutdownNow();
        }
    }

    private void await(CountDownLatch latch) {
        try {
            if (!latch.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting for concurrent test release.");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Concurrent test was interrupted.", exception);
        }
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        verifyCandidateEmail(email);
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }

    private CreateInterviewRequest videoInterview(Long stepId, Short stepOrder, String note) {
        return new CreateInterviewRequest(
                stepId,
                stepOrder,
                InterviewType.VIDEO,
                OffsetDateTime.now().plusDays(1),
                60,
                null,
                "https://meet.example.com/interview",
                note
        );
    }
}
