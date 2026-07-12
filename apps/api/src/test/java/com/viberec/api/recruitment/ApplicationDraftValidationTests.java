package com.viberec.api.recruitment;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.application.service.ResumeNormalizationService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import com.viberec.api.recruitment.jobposting.domain.QuestionType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;

class ApplicationDraftValidationTests {

    private final JobPostingRepository jobPostingRepository = mock(JobPostingRepository.class);
    private final JobPostingQuestionRepository questionRepository = mock(JobPostingQuestionRepository.class);
    private final CandidateAccount candidateAccount = mock(CandidateAccount.class);
    private final JobPosting jobPosting = mock(JobPosting.class);
    private ApplicationDraftService applicationDraftService;

    @BeforeEach
    void setUp() {
        applicationDraftService = new ApplicationDraftService(
                jobPostingRepository,
                mock(ApplicationRepository.class),
                mock(ApplicationResumeRawRepository.class),
                mock(ResumeNormalizationService.class),
                mock(ApplicationAnswerRepository.class),
                questionRepository,
                mock(JdbcTemplate.class),
                mock(ApplicationEventService.class),
                mock(tools.jackson.databind.ObjectMapper.class)
        );
        when(jobPostingRepository.findById(1001L)).thenReturn(Optional.of(jobPosting));
        when(jobPosting.isPublished()).thenReturn(true);
        when(jobPosting.isAcceptingApplicationsAt(org.mockito.ArgumentMatchers.any())).thenReturn(true);
        when(jobPosting.getId()).thenReturn(1001L);
        when(candidateAccount.isEmailVerified()).thenReturn(true);
    }

    @Test
    void rejectsMissingRequiredAnswerBeforeWritingApplication() {
        JobPostingQuestion question = question(10L, QuestionType.TEXT, true, null);
        when(questionRepository.findByJobPostingIdOrderBySortOrder(1001L)).thenReturn(List.of(question));

        assertBadRequest(Map.of());
    }

    @Test
    void rejectsChoiceOutsideConfiguredOptionsBeforeWritingApplication() {
        JobPostingQuestion question = question(
                11L,
                QuestionType.CHOICE,
                true,
                "[\"Remote\",\"Seoul\"]"
        );
        when(questionRepository.findByJobPostingIdOrderBySortOrder(1001L)).thenReturn(List.of(question));

        assertBadRequest(Map.of(
                "answers",
                List.of(Map.of("questionId", 11L, "answerChoice", "Busan"))
        ));
    }

    private JobPostingQuestion question(Long id, QuestionType type, boolean required, String choices) {
        JobPostingQuestion question = mock(JobPostingQuestion.class);
        when(question.getId()).thenReturn(id);
        when(question.getQuestionType()).thenReturn(type);
        when(question.isRequired()).thenReturn(required);
        when(question.getChoices()).thenReturn(choices);
        return question;
    }

    private void assertBadRequest(Map<String, Object> additionalPayload) {
        var payload = new java.util.HashMap<String, Object>();
        payload.put("introduction", "I have led recruitment workflow modernization projects for enterprise hiring teams.");
        payload.put("coreStrength", "I translate hiring operations into resilient platform workflows.");
        payload.putAll(additionalPayload);

        assertThatThrownBy(() -> applicationDraftService.submit(
                1001L,
                candidateAccount,
                new SaveApplicationDraftRequest(payload, null, null, null, null, null)
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.BAD_REQUEST);
    }
}
