package com.viberec.api.recruitment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.jobposting.service.AdminJobPostingService;
import com.viberec.api.admin.jobposting.web.AdminJobPostingUpsertRequest;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.service.CandidateApplicationQueryService;
import com.viberec.api.recruitment.application.web.ResumeEducationDto;
import com.viberec.api.recruitment.application.web.ResumeExperienceDto;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
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
    private JobPostingQuestionRepository jobPostingQuestionRepository;

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
                .hasSize(20)
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
        assertThat(responses.get(1).jobPostingId()).isEqualTo(1001L);
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
