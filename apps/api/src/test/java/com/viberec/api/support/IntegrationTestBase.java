package com.viberec.api.support;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.service.CandidateAccountRecoveryService;
import com.viberec.api.candidate.auth.repository.CandidateAuthMailOutboxRepository;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public abstract class IntegrationTestBase {
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern AUTH_TOKEN_PATTERN = Pattern.compile("token=([^\\s]+)");

    @Autowired
    protected CandidateAuthService candidateAuthService;

    @Autowired
    protected CandidateAccountRecoveryService candidateAccountRecoveryService;

    @Autowired
    protected CandidateAuthMailOutboxRepository candidateAuthMailOutboxRepository;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected JobPostingQuestionRepository jobPostingQuestionRepository;

    @BeforeEach
    void cleanExampleComCandidateData() {
        jdbcTemplate.update("delete from platform.authentication_rate_limit");
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
        verifyCandidateEmail(email);
        return candidateAuthService.requireActiveAccount(signupResponse.sessionToken());
    }

    protected void verifyCandidateEmail(String email) {
        candidateAccountRecoveryService.confirmEmail(latestCandidateAuthToken(email));
    }

    protected String latestCandidateAuthToken(String email) {
        String content = candidateAuthMailOutboxRepository
                .findTopByRecipientEmailOrderByCreatedAtDescIdDesc(email)
                .orElseThrow()
                .getContent();
        var matcher = AUTH_TOKEN_PATTERN.matcher(content);
        if (!matcher.find()) {
            throw new IllegalStateException("Candidate authentication token was not found in mail content.");
        }
        return matcher.group(1);
    }

    protected SaveApplicationDraftRequest validSubmitRequest(
            Long jobPostingId,
            Map<String, Object> resumePayload
    ) {
        Map<String, Object> completedPayload = new HashMap<>(resumePayload);
        completedPayload.put(
                "answers",
                jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(jobPostingId).stream()
                        .map(this::validAnswer)
                        .toList()
        );
        return new SaveApplicationDraftRequest(completedPayload, null, null, null, null, null);
    }

    private Map<String, Object> validAnswer(JobPostingQuestion question) {
        return switch (question.getQuestionType()) {
            case TEXT -> Map.of(
                    "questionId", question.getId(),
                    "answerText", "통합 테스트에서 사용하는 유효한 서술형 답변입니다."
            );
            case CHOICE -> Map.of(
                    "questionId", question.getId(),
                    "answerChoice", firstChoice(question)
            );
            case SCALE -> Map.of(
                    "questionId", question.getId(),
                    "answerScale", 3
            );
        };
    }

    private String firstChoice(JobPostingQuestion question) {
        try {
            List<String> choices = OBJECT_MAPPER.readValue(question.getChoices(), new TypeReference<>() {});
            if (choices.isEmpty()) {
                throw new IllegalStateException("Choice question must define at least one option.");
            }
            return choices.getFirst();
        } catch (JsonProcessingException exception) {
            throw new IllegalStateException("Choice question options are not valid JSON.", exception);
        }
    }
}
