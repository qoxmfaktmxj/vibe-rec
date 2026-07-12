package com.viberec.api.recruitment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.jobposting.service.AdminJobPostingService;
import com.viberec.api.admin.jobposting.web.AdminJobPostingUpsertRequest;
import com.viberec.api.admin.jobposting.web.JobPostingPublicationState;
import com.viberec.api.admin.jobposting.web.ScheduleJobPostingPublicationRequest;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.repository.ApplicationEventRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.recruitment.evaluation.domain.ScorecardCriterion;
import com.viberec.api.recruitment.evaluation.repository.ScorecardCriterionRepository;
import com.viberec.api.recruitment.jobposting.web.SaveJobPostingQuestionRequest;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentCategory;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import com.viberec.api.recruitment.jobposting.service.JobPostingService;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

class RecruitmentMvpTests extends IntegrationTestBase {

    @Autowired
    private JobPostingService jobPostingService;

    @Autowired
    private ApplicationDraftService applicationDraftService;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ApplicationResumeRawRepository applicationResumeRawRepository;

    @Autowired
    private ApplicationAnswerRepository applicationAnswerRepository;

    @Autowired
    private ApplicationEventRepository applicationEventRepository;

    @Autowired
    private JobPostingQuestionRepository jobPostingQuestionRepository;

    @Autowired
    private JobPostingStepRepository jobPostingStepRepository;

    @Autowired
    private ScorecardCriterionRepository scorecardCriterionRepository;

    @Autowired
    private CandidateSessionRepository candidateSessionRepository;

    @Autowired
    private CandidateAccountRepository candidateAccountRepository;

    @Autowired
    private CandidateApplicationQueryService candidateApplicationQueryService;

    @Autowired
    private AdminJobPostingService adminJobPostingService;

    @BeforeEach
    void cleanApplications() {
        applicationEventRepository.deleteAll();
        applicationAnswerRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        jobPostingQuestionRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void returnsSeededPublishedJobPostings() {
        var jobPostings = jobPostingService.getPublishedJobPostings();

        assertThat(jobPostings)
                .hasSizeGreaterThanOrEqualTo(20)
                .extracting("id")
                .contains(1001L, 1002L, 1011L, 1020L);

        assertThat(jobPostings)
                .extracting("title")
                .contains("백엔드 플랫폼 엔지니어", "프로덕트 디자이너", "데이터 분석가 (채용 운영)");

        assertThat(jobPostings)
                .extracting("employmentType")
                .contains("FULL_TIME", "CONTRACT");

        assertThat(jobPostings)
                .filteredOn(posting -> posting.id().equals(1005L))
                .first()
                .satisfies(posting -> {
                    assertThat(posting.recruitmentCategory()).isEqualTo(RecruitmentCategory.NEW_GRAD);
                    assertThat(posting.recruitmentMode()).isEqualTo(RecruitmentMode.FIXED_TERM);
                });

        assertThat(jobPostings)
                .filteredOn(posting -> posting.id().equals(1003L))
                .first()
                .satisfies(posting -> {
                    assertThat(posting.recruitmentCategory()).isEqualTo(RecruitmentCategory.EXPERIENCED);
                    assertThat(posting.recruitmentMode()).isEqualTo(RecruitmentMode.ROLLING);
                    assertThat(posting.closesAt()).isNull();
                });
    }

    @Test
    @Transactional
    void createsRollingJobPostingWithoutCloseDate() {
        var response = adminJobPostingService.createJobPosting(
                new AdminJobPostingUpsertRequest(
                        null,
                        "talent-pool-architect",
                        "Talent Pool Architect",
                        "Rolling recruitment for long-term platform hires",
                        "Build and maintain a rolling pipeline for platform talent.",
                        "FULL_TIME",
                        RecruitmentCategory.EXPERIENCED,
                        RecruitmentMode.ROLLING,
                        "Seoul",
                        com.viberec.api.recruitment.jobposting.domain.JobPostingStatus.OPEN,
                        true,
                        OffsetDateTime.now().minusDays(1),
                        null
                )
        );

        assertThat(response.id()).isNotNull();
        assertThat(response.recruitmentMode()).isEqualTo(RecruitmentMode.ROLLING);
        assertThat(response.closesAt()).isNull();
    }

    @Test
    @Transactional
    void updatesExistingJobPostingToNewGradFixedTerm() {
        var opensAt = OffsetDateTime.now().minusDays(2);
        var closesAt = OffsetDateTime.now().plusDays(10);

        var response = adminJobPostingService.updateJobPosting(
                1001L,
                new AdminJobPostingUpsertRequest(
                        90101L,
                        "platform-backend-engineer",
                        "Platform Backend Engineer",
                        "Updated hiring lane for early-career backend engineers",
                        "Updated description for new-grad backend pipeline.",
                        "FULL_TIME",
                        RecruitmentCategory.NEW_GRAD,
                        RecruitmentMode.FIXED_TERM,
                        "Seoul",
                        com.viberec.api.recruitment.jobposting.domain.JobPostingStatus.OPEN,
                        true,
                        opensAt,
                        closesAt
                )
        );

        assertThat(response.id()).isEqualTo(1001L);
        assertThat(response.recruitmentCategory()).isEqualTo(RecruitmentCategory.NEW_GRAD);
        assertThat(response.recruitmentMode()).isEqualTo(RecruitmentMode.FIXED_TERM);
        assertThat(response.closesAt()).isEqualTo(closesAt);
    }

    @Test
    @Transactional
    void schedulesPublicationUsingServerTimeAndKeepsPreviewAvailableBeforeRelease() {
        OffsetDateTime originalOpen = OffsetDateTime.now().plusDays(2);
        OffsetDateTime originalClose = originalOpen.plusDays(10);
        var created = adminJobPostingService.createJobPosting(
                new AdminJobPostingUpsertRequest(
                        null,
                        "scheduled-platform-role-" + System.nanoTime(),
                        "Scheduled Platform Role",
                        "A posting prepared for a controlled release",
                        "This draft verifies preview and scheduled publication boundaries.",
                        "FULL_TIME",
                        RecruitmentCategory.EXPERIENCED,
                        RecruitmentMode.FIXED_TERM,
                        "Seoul",
                        com.viberec.api.recruitment.jobposting.domain.JobPostingStatus.DRAFT,
                        false,
                        originalOpen,
                        originalClose
                )
        );

        OffsetDateTime scheduledAt = OffsetDateTime.now().plusDays(5);
        var scheduled = adminJobPostingService.schedulePublication(
                created.id(),
                new ScheduleJobPostingPublicationRequest(scheduledAt)
        );

        assertThat(scheduled.publicationState()).isEqualTo(JobPostingPublicationState.SCHEDULED);
        assertThat(scheduled.status().name()).isEqualTo("OPEN");
        assertThat(scheduled.published()).isTrue();
        assertThat(scheduled.closesAt()).isEqualTo(scheduledAt.plusDays(10));
        assertThat(adminJobPostingService.getPreview(created.id()).jobPosting().id()).isEqualTo(created.id());
        assertThat(jobPostingService.getPublishedJobPostings())
                .extracting("id")
                .doesNotContain(created.id());
        assertThatThrownBy(() -> jobPostingService.getJobPosting(created.id()))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        var published = adminJobPostingService.schedulePublication(
                created.id(),
                new ScheduleJobPostingPublicationRequest(OffsetDateTime.now().minusMinutes(1))
        );

        assertThat(published.publicationState()).isEqualTo(JobPostingPublicationState.PUBLISHED);
        assertThat(jobPostingService.getPublishedJobPostings())
                .extracting("id")
                .contains(created.id());
        assertThatThrownBy(() -> adminJobPostingService.schedulePublication(
                created.id(),
                new ScheduleJobPostingPublicationRequest(OffsetDateTime.now().plusDays(1))
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    @Transactional
    void clonesPostingConfigurationIntoIndependentDraftRecords() {
        jobPostingQuestionRepository.save(new com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion(
                jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L).getFirst().getJobPosting(),
                "Describe an enterprise migration you led.",
                com.viberec.api.recruitment.jobposting.domain.QuestionType.TEXT,
                null,
                true,
                90
        ));
        var sourceSteps = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(1001L);
        var sourceInterviewStep = sourceSteps.stream()
                .filter(step -> step.getStepType().name().equals("INTERVIEW"))
                .findFirst()
                .orElseThrow();
        var sourceCriterion = scorecardCriterionRepository.save(new ScorecardCriterion(
                sourceInterviewStep,
                "Clone verification " + System.nanoTime(),
                "clone verification " + System.nanoTime(),
                "This criterion must be copied to a new step record.",
                (short) 10,
                false,
                (short) 90
        ));

        var clone = adminJobPostingService.cloneJobPosting(1001L);
        var clonedSteps = jobPostingStepRepository.findByJobPostingIdOrderByStepOrderAsc(clone.id());
        var clonedQuestions = jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(clone.id());
        var clonedInterviewStep = clonedSteps.stream()
                .filter(step -> step.getStepOrder() == sourceInterviewStep.getStepOrder())
                .findFirst()
                .orElseThrow();
        var clonedCriteria = scorecardCriterionRepository
                .findByJobPostingStepIdOrderBySortOrderAscIdAsc(clonedInterviewStep.getId());

        assertThat(clone.status().name()).isEqualTo("DRAFT");
        assertThat(clone.published()).isFalse();
        assertThat(clone.publicKey()).startsWith("platform-backend-engineer-copy");
        assertThat(clonedSteps).hasSameSizeAs(sourceSteps);
        assertThat(clonedSteps).extracting("id").doesNotContainAnyElementsOf(
                sourceSteps.stream().map(step -> step.getId()).toList()
        );
        assertThat(clonedQuestions)
                .extracting("questionText")
                .contains("Describe an enterprise migration you led.");
        assertThat(clonedCriteria)
                .anySatisfy(criterion -> {
                    assertThat(criterion.getName()).isEqualTo(sourceCriterion.getName());
                    assertThat(criterion.getId()).isNotEqualTo(sourceCriterion.getId());
                });
    }

    @Test
    void savesApplicationDraftForOpenJobPosting() {
        var candidate = createCandidateAccount("Kim Recruit", "kim.recruit@example.com", "010-1234-5678");

        var response = applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects.",
                                "careerYears", 6
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(response.jobPostingId()).isEqualTo(1001L);
        assertThat(response.applicantEmail()).isEqualTo("kim.recruit@example.com");
        assertThat(response.submittedAt()).isNull();
        assertThat(applicationRepository.findByJobPostingIdAndCandidateAccountId(1001L, candidate.getId())).isPresent();
        assertThat(applicationResumeRawRepository.findById(response.applicationId())).isPresent();
    }

    @Test
    void submitsApplicationForOpenJobPosting() {
        var candidate = createCandidateAccount("Kim Recruit", "kim.submit@example.com", "010-1234-5678");

        var response = applicationDraftService.submit(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.",
                                "coreStrength", "I translate hiring operations into resilient platform workflows.",
                                "careerYears", 6
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(response.status().name()).isEqualTo("SUBMITTED");
        assertThat(response.submittedAt()).isNotNull();
        assertThat(applicationRepository.findByJobPostingIdAndCandidateAccountId(1001L, candidate.getId()))
                .isPresent()
                .get()
                .extracting("status")
                .hasToString("SUBMITTED");
    }

    @Test
    void requiresVerifiedEmailOnlyForFinalSubmission() {
        var signup = candidateAuthService.signup(
                new com.viberec.api.candidate.auth.web.CandidateSignupRequest(
                        "Unverified Kim",
                        "unverified@example.com",
                        "010-4040-5050",
                        "password123"
                )
        );
        var candidate = candidateAuthService.requireActiveAccount(signup.sessionToken());
        var request = validSubmitRequest(1001L, Map.of(
                "introduction", "I can save a draft while email verification is pending.",
                "coreStrength", "I complete identity verification before final submission."
        ));

        assertThat(applicationDraftService.saveDraft(1001L, candidate, request).submittedAt()).isNull();
        assertThatThrownBy(() -> applicationDraftService.submit(1001L, candidate, request))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.FORBIDDEN);

        verifyCandidateEmail("unverified@example.com");
        var verifiedCandidate = candidateAuthService.requireActiveAccount(signup.sessionToken());
        assertThat(applicationDraftService.submit(1001L, verifiedCandidate, request).submittedAt()).isNotNull();
    }

    @Test
    void replaysIdenticalSubmissionAndRejectsChangedPayloadForSameIdempotencyKey() {
        var candidate = createCandidateAccount("Idempotent Kim", "idempotent@example.com", "010-2468-1357");
        var request = new SaveApplicationDraftRequest(
                Map.of(
                        "introduction", "I have delivered reliable application submission workflows for enterprise hiring teams.",
                        "coreStrength", "I design retry-safe APIs that preserve a single business outcome."
                ),
                null, null, null, null, null
        );
        String idempotencyKey = "submission-retry-1001";

        var first = applicationDraftService.submit(1001L, candidate, request, idempotencyKey);
        var replay = applicationDraftService.submit(1001L, candidate, request, idempotencyKey);

        assertThat(replay.applicationId()).isEqualTo(first.applicationId());
        assertThat(applicationRepository.findByJobPostingIdAndCandidateAccountId(1001L, candidate.getId())).isPresent();
        assertThat(applicationEventRepository.countByApplicationIdAndEventType(
                first.applicationId(),
                "APPLICATION_SUBMITTED"
        )).isEqualTo(1);

        var changedRequest = new SaveApplicationDraftRequest(
                Map.of(
                        "introduction", "This is a different submission payload with enough content to pass validation.",
                        "coreStrength", "The same key must never authorize a changed request payload."
                ),
                null, null, null, null, null
        );
        assertThatThrownBy(() -> applicationDraftService.submit(
                1001L,
                candidate,
                changedRequest,
                idempotencyKey
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void rejectsSubmissionWhenRequiredQuestionIsMissing() {
        var candidate = createCandidateAccount("Required Kim", "required@example.com", "010-1212-3434");
        jobPostingService.saveQuestionsForJobPosting(
                1001L,
                List.of(new SaveJobPostingQuestionRequest(
                        "지원 직무와 관련된 경험을 설명해 주세요.",
                        "TEXT",
                        null,
                        true,
                        0
                ))
        );

        assertThatThrownBy(() -> applicationDraftService.submit(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.",
                                "coreStrength", "I translate hiring operations into resilient platform workflows."
                        ),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void rejectsChoiceThatIsNotConfiguredForQuestion() {
        var candidate = createCandidateAccount("Choice Kim", "choice@example.com", "010-5656-7878");
        jobPostingService.saveQuestionsForJobPosting(
                1001L,
                List.of(new SaveJobPostingQuestionRequest(
                        "선호 근무 방식을 선택해 주세요.",
                        "CHOICE",
                        "[\"Remote\",\"Seoul\"]",
                        true,
                        0
                ))
        );
        Long questionId = jobPostingQuestionRepository
                .findByJobPostingIdOrderBySortOrder(1001L)
                .getFirst()
                .getId();

        assertThatThrownBy(() -> applicationDraftService.submit(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.",
                                "coreStrength", "I translate hiring operations into resilient platform workflows.",
                                "answers", List.of(Map.of(
                                        "questionId", questionId,
                                        "answerChoice", "Busan"
                                ))
                        ),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void submitsConfiguredTextChoiceAndScaleAnswers() {
        var candidate = createCandidateAccount("Typed Kim", "typed@example.com", "010-9898-7676");
        jobPostingService.saveQuestionsForJobPosting(
                1001L,
                List.of(
                        new SaveJobPostingQuestionRequest("관련 경험을 설명해 주세요.", "TEXT", null, true, 0),
                        new SaveJobPostingQuestionRequest(
                                "선호 근무 방식을 선택해 주세요.",
                                "CHOICE",
                                "[\"Remote\",\"Seoul\"]",
                                true,
                                1
                        ),
                        new SaveJobPostingQuestionRequest("직무 적합도를 선택해 주세요.", "SCALE", null, true, 2)
                )
        );
        var questions = jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(1001L);

        var response = applicationDraftService.submit(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.",
                                "coreStrength", "I translate hiring operations into resilient platform workflows.",
                                "answers", List.of(
                                        Map.of("questionId", questions.get(0).getId(), "answerText", "관련 플랫폼을 운영했습니다."),
                                        Map.of("questionId", questions.get(1).getId(), "answerChoice", "Remote"),
                                        Map.of("questionId", questions.get(2).getId(), "answerScale", 5)
                                )
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(applicationAnswerRepository.findByApplicationId(response.applicationId()))
                .hasSize(3)
                .anySatisfy(answer -> assertThat(answer.getAnswerText()).isEqualTo("관련 플랫폼을 운영했습니다."))
                .anySatisfy(answer -> assertThat(answer.getAnswerChoice()).isEqualTo("Remote"))
                .anySatisfy(answer -> assertThat(answer.getAnswerScale()).isEqualTo((short) 5));
    }

    @Test
    void savesApplicationDraftForRollingJobPosting() {
        var candidate = createCandidateAccount("Rolling Kim", "rolling@example.com", "010-2222-1111");

        var response = applicationDraftService.saveDraft(
                1003L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I am open to rolling opportunities and long-term talent pooling.",
                                "careerYears", 8
                        ),
                        null, null, null, null, null
                )
        );

        assertThat(response.jobPostingId()).isEqualTo(1003L);
        assertThat(response.submittedAt()).isNull();
    }

    @Test
    void rejectsDraftSaveAfterSubmission() {
        var candidate = createCandidateAccount("Locked Applicant", "locked@example.com", "010-5555-7777");

        applicationDraftService.submit(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I have managed several applicant pipelines and legacy modernization programs.",
                                "coreStrength", "I maintain strong delivery discipline across hiring operations."
                        ),
                        null, null, null, null, null
                )
        );

        assertThatThrownBy(() -> applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of("introduction", "Trying to edit after submit."),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void rejectsDraftSaveForClosedJobPosting() {
        var candidate = createCandidateAccount("Closed Applicant", "closed@example.com", "010-9999-0000");

        assertThatThrownBy(() -> applicationDraftService.saveDraft(
                1002L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of("portfolioUrl", "https://example.com"),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void returnsCandidateApplicationForJobPosting() {
        var candidate = createCandidateAccount("Flow Kim", "flow@example.com", "010-3333-4444");

        var draftResponse = applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "I want to resume this draft later.",
                                "coreStrength", "I connect recruiting operations and product delivery."
                        ),
                        List.of(new ResumeEducationDto(
                                null, "Korea University", "BACHELOR", "Computer Science", null, LocalDate.parse("2022-02-28"), null, 0
                        )),
                        List.of(new ResumeExperienceDto(
                                null, "Vibe Labs", "Backend Engineer", LocalDate.parse("2022-03-01"), null, "Built hiring workflow APIs.", 0
                        )),
                        null, null, null
                )
        );

        var response = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);

        assertThat(response.applicationId()).isEqualTo(draftResponse.applicationId());
        assertThat(response.resumePayload()).containsEntry("introduction", "I want to resume this draft later.");
        assertThat(response.educations()).hasSize(1);
        assertThat(response.experiences()).hasSize(1);
    }

    @Test
    void returnsCandidateApplicationsInRecentOrder() {
        var candidate = createCandidateAccount("History Kim", "history@example.com", "010-4545-5656");

        applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(Map.of("introduction", "First draft."), null, null, null, null, null)
        );
        applicationDraftService.submit(
                1011L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "Second application with enough content to submit successfully.",
                                "coreStrength", "I can ship candidate-facing workflows safely."
                        ),
                        null, null, null, null, null
                )
        );

        var responses = candidateApplicationQueryService.getCandidateApplications(candidate);

        assertThat(responses).hasSize(2);
        assertThat(responses.getFirst().jobPostingId()).isEqualTo(1011L);
        assertThat(responses.getFirst().candidateVisibleStage().name()).isEqualTo("SCREENING");
        assertThat(responses.getFirst().nextAction().name()).isEqualTo("WAIT_FOR_REVIEW");
        assertThat(responses.getFirst().lastChangedAt()).isNotNull();
        assertThat(responses.get(1).jobPostingId()).isEqualTo(1001L);
        assertThat(responses.get(1).candidateVisibleStage().name()).isEqualTo("DRAFT");
        assertThat(responses.get(1).nextAction().name()).isEqualTo("COMPLETE_APPLICATION");
    }

    @Test
    void returnsCandidateApplicationWizardStateForJobPosting() {
        var candidate = createCandidateAccount("Wizard Kim", "wizard@example.com", "010-1212-3434");
        jobPostingService.saveQuestionsForJobPosting(
                1001L,
                List.of(
                        new SaveJobPostingQuestionRequest(
                                "지원 동기를 한 문장으로 설명해 주세요.",
                                "TEXT",
                                null,
                                true,
                                0
                        )
                )
        );
        Long questionId = jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(1001L).getFirst().getId();

        applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "이 질문 흐름이 저장 후 다시 보여야 합니다.",
                                "coreStrength", "상태를 안전하게 이어받는 구현 역량이 있습니다.",
                                "currentStep", 3,
                                "motivationFit", "질문형 지원 플로우를 끝까지 설계할 수 있습니다.",
                                "answers", List.of(
                                        Map.of(
                                                "questionId", questionId,
                                                "answerText", "플랫폼 완성도를 높일 수 있습니다."
                                        )
                                )
                        ),
                        null, null, null, null, null
                )
        );

        var response = candidateApplicationQueryService.getCandidateApplication(1001L, candidate);

        assertThat(response.currentStep()).isEqualTo((short) 3);
        assertThat(response.motivationFit()).isEqualTo("질문형 지원 플로우를 끝까지 설계할 수 있습니다.");
        assertThat(response.answers())
                .hasSize(1)
                .first()
                .extracting("questionId", "answerText")
                .containsExactly(questionId, "플랫폼 완성도를 높일 수 있습니다.");
    }

    @Test
    void rejectsAnswersForQuestionFromDifferentJobPosting() {
        var candidate = createCandidateAccount("Guard Kim", "guard@example.com", "010-3434-5656");
        jobPostingService.saveQuestionsForJobPosting(
                1011L,
                List.of(
                        new SaveJobPostingQuestionRequest(
                                "다른 공고 질문입니다.",
                                "TEXT",
                                null,
                                true,
                                0
                        )
                )
        );
        Long foreignQuestionId = jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(1011L).getFirst().getId();

        assertThatThrownBy(() -> applicationDraftService.saveDraft(
                1001L,
                candidate,
                new SaveApplicationDraftRequest(
                        Map.of(
                                "introduction", "이 답변은 다른 공고 질문을 참조해서는 안 됩니다.",
                                "answers", List.of(
                                        Map.of(
                                                "questionId", foreignQuestionId,
                                                "answerText", "잘못된 질문 연결"
                                        )
                                )
                        ),
                        null, null, null, null, null
                )
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
