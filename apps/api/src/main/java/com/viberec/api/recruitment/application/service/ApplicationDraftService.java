package com.viberec.api.recruitment.application.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationAnswer;
import com.viberec.api.recruitment.application.domain.ApplicationResumeRaw;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.web.ApplicationDraftResponse;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import com.viberec.api.recruitment.jobposting.domain.QuestionType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationDraftService {

    private static final Pattern IDEMPOTENCY_KEY_PATTERN = Pattern.compile("[A-Za-z0-9._:-]{8,100}");

    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;
    private final ResumeNormalizationService resumeNormalizationService;
    private final ApplicationAnswerRepository applicationAnswerRepository;
    private final JobPostingQuestionRepository jobPostingQuestionRepository;
    private final JdbcTemplate jdbcTemplate;
    private final ApplicationEventService applicationEventService;
    private final tools.jackson.databind.ObjectMapper requestHashObjectMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ApplicationDraftService(
            JobPostingRepository jobPostingRepository,
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService,
            ApplicationAnswerRepository applicationAnswerRepository,
            JobPostingQuestionRepository jobPostingQuestionRepository,
            JdbcTemplate jdbcTemplate,
            ApplicationEventService applicationEventService,
            tools.jackson.databind.ObjectMapper requestHashObjectMapper
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
        this.applicationAnswerRepository = applicationAnswerRepository;
        this.jobPostingQuestionRepository = jobPostingQuestionRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.applicationEventService = applicationEventService;
        this.requestHashObjectMapper = requestHashObjectMapper;
    }

    @Transactional
    public ApplicationDraftResponse saveDraft(Long jobPostingId, CandidateAccount candidateAccount, SaveApplicationDraftRequest request) {
        JobPosting jobPosting = loadActiveJobPosting(jobPostingId);
        Application application = applicationRepository
                .findByJobPostingIdAndCandidateAccountId(jobPostingId, candidateAccount.getId())
                .map(existing -> {
                    ensureEditable(existing);
                    existing.updateDraft(candidateAccount, candidateAccount.getDisplayName(), candidateAccount.getEmail(), candidateAccount.getPhone());
                    return existing;
                })
                .orElseGet(() -> new Application(
                        jobPosting,
                        candidateAccount,
                        candidateAccount.getDisplayName(),
                        candidateAccount.getEmail(),
                        candidateAccount.getPhone()
                ));

        Application savedApplication = applicationRepository.save(application);
        saveResumeRaw(savedApplication, request.resumePayload());
        resumeNormalizationService.saveNormalizedResume(
                savedApplication,
                request.educations(),
                request.experiences(),
                request.skills(),
                request.certifications(),
                request.languages()
        );
        saveAnswers(savedApplication, jobPosting, request.resumePayload());
        return toResponse(savedApplication, jobPostingId);
    }

    @Transactional
    public ApplicationDraftResponse submit(Long jobPostingId, CandidateAccount candidateAccount, SaveApplicationDraftRequest request) {
        JobPosting jobPosting = loadActiveJobPosting(jobPostingId);
        return submitNew(jobPostingId, candidateAccount, request, jobPosting);
    }

    @Transactional
    public ApplicationDraftResponse submit(
            Long jobPostingId,
            CandidateAccount candidateAccount,
            SaveApplicationDraftRequest request,
            String idempotencyKey
    ) {
        String normalizedKey = validateIdempotencyKey(idempotencyKey);
        String requestHash = hashRequest(request);
        JobPosting jobPosting = loadJobPosting(jobPostingId);
        int inserted = reserveSubmission(candidateAccount.getId(), jobPostingId, normalizedKey, requestHash);

        if (inserted == 0) {
            return replaySubmission(candidateAccount.getId(), jobPostingId, normalizedKey, requestHash);
        }

        validateActiveJobPosting(jobPosting);
        ApplicationDraftResponse response = submitNew(jobPostingId, candidateAccount, request, jobPosting);
        completeSubmission(candidateAccount.getId(), jobPostingId, normalizedKey, response.applicationId());
        return response;
    }

    private ApplicationDraftResponse submitNew(
            Long jobPostingId,
            CandidateAccount candidateAccount,
            SaveApplicationDraftRequest request,
            JobPosting jobPosting
    ) {
        if (!candidateAccount.isEmailVerified()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Email verification is required before submitting an application."
            );
        }
        validateSubmitPayload(jobPosting, request.resumePayload());

        Application application = applicationRepository
                .findByJobPostingIdAndCandidateAccountId(jobPostingId, candidateAccount.getId())
                .map(existing -> {
                    ensureEditable(existing);
                    existing.submit(candidateAccount, candidateAccount.getDisplayName(), candidateAccount.getEmail(), candidateAccount.getPhone());
                    return existing;
                })
                .orElseGet(() -> {
                    Application created = new Application(
                            jobPosting,
                            candidateAccount,
                            candidateAccount.getDisplayName(),
                            candidateAccount.getEmail(),
                            candidateAccount.getPhone()
                    );
                    created.submit(candidateAccount, candidateAccount.getDisplayName(), candidateAccount.getEmail(), candidateAccount.getPhone());
                    return created;
                });

        Application savedApplication = applicationRepository.save(application);
        saveResumeRaw(savedApplication, request.resumePayload());
        resumeNormalizationService.saveNormalizedResume(
                savedApplication,
                request.educations(),
                request.experiences(),
                request.skills(),
                request.certifications(),
                request.languages()
        );
        saveAnswers(savedApplication, jobPosting, request.resumePayload());
        applicationEventService.record(
                savedApplication,
                "APPLICATION_SUBMITTED",
                "DRAFT",
                "SUBMITTED",
                "CANDIDATE",
                candidateAccount.getId(),
                null,
                "{\"jobPostingId\":" + jobPostingId + "}"
        );
        return toResponse(savedApplication, jobPostingId);
    }

    private String validateIdempotencyKey(String idempotencyKey) {
        String normalized = idempotencyKey == null ? "" : idempotencyKey.trim();
        if (!IDEMPOTENCY_KEY_PATTERN.matcher(normalized).matches()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Idempotency-Key must be 8-100 characters using letters, numbers, '.', '_', ':', or '-'."
            );
        }
        return normalized;
    }

    private String hashRequest(SaveApplicationDraftRequest request) {
        try {
            byte[] requestBytes = requestHashObjectMapper.writeValueAsBytes(request);
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(requestBytes);
            return HexFormat.of().formatHex(digest);
        } catch (tools.jackson.core.JacksonException | NoSuchAlgorithmException exception) {
            throw new IllegalStateException("Failed to create submission request hash.", exception);
        }
    }

    private int reserveSubmission(Long candidateAccountId, Long jobPostingId, String idempotencyKey, String requestHash) {
        return jdbcTemplate.update("""
                insert into recruit.application_submission_request (
                    candidate_account_id,
                    job_posting_id,
                    idempotency_key,
                    request_hash
                ) values (?, ?, ?, ?)
                on conflict (candidate_account_id, job_posting_id, idempotency_key) do nothing
                """, candidateAccountId, jobPostingId, idempotencyKey, requestHash);
    }

    private ApplicationDraftResponse replaySubmission(
            Long candidateAccountId,
            Long jobPostingId,
            String idempotencyKey,
            String requestHash
    ) {
        SubmissionReservation reservation = jdbcTemplate.queryForObject("""
                select request_hash, application_id
                from recruit.application_submission_request
                where candidate_account_id = ?
                  and job_posting_id = ?
                  and idempotency_key = ?
                """, (resultSet, rowNumber) -> new SubmissionReservation(
                resultSet.getString("request_hash"),
                resultSet.getObject("application_id", Long.class)
        ), candidateAccountId, jobPostingId, idempotencyKey);

        if (reservation == null || !requestHash.equals(reservation.requestHash())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Idempotency-Key was already used with a different request.");
        }
        if (reservation.applicationId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The original submission is still being processed.");
        }

        Application application = applicationRepository
                .findByIdAndCandidateAccountId(reservation.applicationId(), candidateAccountId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "The original submission result is unavailable."));
        return toResponse(application, jobPostingId);
    }

    private void completeSubmission(Long candidateAccountId, Long jobPostingId, String idempotencyKey, Long applicationId) {
        int updated = jdbcTemplate.update("""
                update recruit.application_submission_request
                set application_id = ?, completed_at = current_timestamp
                where candidate_account_id = ?
                  and job_posting_id = ?
                  and idempotency_key = ?
                """, applicationId, candidateAccountId, jobPostingId, idempotencyKey);
        if (updated != 1) {
            throw new IllegalStateException("Failed to complete submission reservation.");
        }
    }

    private record SubmissionReservation(String requestHash, Long applicationId) {
    }

    private JobPosting loadActiveJobPosting(Long jobPostingId) {
        JobPosting jobPosting = loadJobPosting(jobPostingId);
        validateActiveJobPosting(jobPosting);
        return jobPosting;
    }

    private JobPosting loadJobPosting(Long jobPostingId) {
        return jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
    }

    private void validateActiveJobPosting(JobPosting jobPosting) {
        if (!jobPosting.isPublished()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다.");
        }
        validateApplicationWindow(jobPosting);
    }

    private void validateApplicationWindow(JobPosting jobPosting) {
        OffsetDateTime now = OffsetDateTime.now();
        if (!jobPosting.isAcceptingApplicationsAt(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "공고가 열려 있는 동안에만 지원서를 저장하거나 제출할 수 있습니다.");
        }
    }

    private void ensureEditable(Application application) {
        if (application.getStatus() != com.viberec.api.recruitment.application.domain.ApplicationStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 제출된 지원서입니다.");
        }
    }

    private void validateSubmitPayload(JobPosting jobPosting, Map<String, Object> resumePayload) {
        String introduction = readPayloadText(resumePayload, "introduction");
        if (introduction == null || introduction.length() < 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자기소개는 20자 이상 입력해 주세요.");
        }

        String coreStrength = readPayloadText(resumePayload, "coreStrength");
        if (coreStrength == null || coreStrength.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "핵심 역량은 10자 이상 입력해 주세요.");
        }

        validateSubmittedAnswers(jobPosting, resumePayload);
    }

    private void validateSubmittedAnswers(JobPosting jobPosting, Map<String, Object> resumePayload) {
        List<JobPostingQuestion> questions = jobPostingQuestionRepository
                .findByJobPostingIdOrderBySortOrder(jobPosting.getId());
        Map<Long, JobPostingQuestion> questionIndex = questions.stream()
                .collect(Collectors.toMap(JobPostingQuestion::getId, question -> question));

        Object answersValue = resumePayload.get("answers");
        List<?> submittedAnswers;
        if (answersValue == null) {
            submittedAnswers = List.of();
        } else if (answersValue instanceof List<?> answers) {
            submittedAnswers = answers;
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문 답변 형식이 올바르지 않습니다.");
        }

        Set<Long> seenQuestionIds = new HashSet<>();
        Set<Long> answeredQuestionIds = new HashSet<>();
        for (Object item : submittedAnswers) {
            if (!(item instanceof Map<?, ?> answer)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문 답변 형식이 올바르지 않습니다.");
            }

            Object questionIdValue = answer.get("questionId");
            if (!(questionIdValue instanceof Number number)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문 식별자가 필요합니다.");
            }

            Long questionId = number.longValue();
            if (!seenQuestionIds.add(questionId)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "같은 질문에 답변을 여러 번 제출할 수 없습니다.");
            }

            JobPostingQuestion question = questionIndex.get(questionId);
            if (question == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "이 공고에 속하지 않은 질문입니다.");
            }

            if (validateAnswerValue(question, answer)) {
                answeredQuestionIds.add(questionId);
            }
        }

        boolean missingRequiredAnswer = questions.stream()
                .filter(JobPostingQuestion::isRequired)
                .anyMatch(question -> !answeredQuestionIds.contains(question.getId()));
        if (missingRequiredAnswer) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "필수 질문에 모두 답변해 주세요.");
        }
    }

    private boolean validateAnswerValue(JobPostingQuestion question, Map<?, ?> answer) {
        boolean hasText = hasTextValue(answer.get("answerText"));
        boolean hasChoice = hasTextValue(answer.get("answerChoice"));
        boolean hasScale = answer.get("answerScale") instanceof Number;
        int answerValueCount = (hasText ? 1 : 0) + (hasChoice ? 1 : 0) + (hasScale ? 1 : 0);

        if (answerValueCount == 0) {
            return false;
        }
        if (answerValueCount > 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문마다 한 가지 형식으로만 답변해 주세요.");
        }

        if (question.getQuestionType() == QuestionType.TEXT && !hasText) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "서술형 질문에는 텍스트로 답변해 주세요.");
        }
        if (question.getQuestionType() == QuestionType.CHOICE) {
            if (!hasChoice) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "선택형 질문의 답변을 선택해 주세요.");
            }
            String selectedChoice = answer.get("answerChoice").toString().trim();
            if (!readAllowedChoices(question).contains(selectedChoice)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "질문에 등록된 선택지만 제출할 수 있습니다.");
            }
        }
        if (question.getQuestionType() == QuestionType.SCALE) {
            if (!hasScale) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "평점형 질문에는 1점부터 5점까지 선택해 주세요.");
            }
            Number scaleNumber = (Number) answer.get("answerScale");
            double rawScale = scaleNumber.doubleValue();
            int scale = scaleNumber.intValue();
            if (!Double.isFinite(rawScale) || rawScale != scale || scale < 1 || scale > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "평점 답변은 1점부터 5점 사이여야 합니다.");
            }
        }
        return true;
    }

    private List<String> readAllowedChoices(JobPostingQuestion question) {
        String choices = question.getChoices();
        if (choices == null || choices.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(choices, new TypeReference<>() {});
        } catch (JsonProcessingException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "공고 선택지 구성이 올바르지 않습니다.");
        }
    }

    private boolean hasTextValue(Object value) {
        return value instanceof String text && !text.trim().isEmpty();
    }

    private boolean hasAnyAnswerValue(Map<?, ?> answer) {
        return hasTextValue(answer.get("answerText"))
                || hasTextValue(answer.get("answerChoice"))
                || answer.get("answerScale") instanceof Number;
    }

    private String readPayloadText(Map<String, Object> resumePayload, String key) {
        Object value = resumePayload.get(key);
        if (value == null) {
            return null;
        }
        String text = value.toString().trim();
        return text.isEmpty() ? null : text;
    }

    @SuppressWarnings("unchecked")
    private void saveAnswers(Application application, JobPosting jobPosting, Map<String, Object> resumePayload) {
        Object stepObj = resumePayload.get("currentStep");
        if (stepObj instanceof Number) {
            application.updateCurrentStep(((Number) stepObj).shortValue());
        }

        Object mfObj = resumePayload.get("motivationFit");
        if (mfObj != null) {
            application.updateMotivationFit(mfObj.toString());
        }

        Object answersObj = resumePayload.get("answers");
        if (answersObj instanceof List<?> answersList) {
            Map<Long, JobPostingQuestion> questionIndex = jobPostingQuestionRepository
                    .findByJobPostingIdOrderBySortOrder(jobPosting.getId())
                    .stream()
                    .collect(Collectors.toMap(JobPostingQuestion::getId, question -> question));
            applicationAnswerRepository.deleteByApplicationId(application.getId());
            List<ApplicationAnswer> answers = answersList.stream()
                    .filter(item -> item instanceof Map)
                    .map(item -> (Map<String, Object>) item)
                    .filter(map -> map.get("questionId") instanceof Number)
                    .filter(this::hasAnyAnswerValue)
                    .map(map -> {
                        Long questionId = ((Number) map.get("questionId")).longValue();
                        JobPostingQuestion question = questionIndex.get(questionId);
                        if (question == null) {
                            throw new ResponseStatusException(
                                    HttpStatus.BAD_REQUEST,
                                    "이 공고에 속하지 않은 질문입니다."
                            );
                        }
                        Object answerTextObj = map.get("answerText");
                        String answerText = answerTextObj instanceof String s ? s : null;
                        Object answerChoiceObj = map.get("answerChoice");
                        String answerChoice = answerChoiceObj instanceof String s ? s : null;
                        Object answerScaleObj = map.get("answerScale");
                        Short answerScale = null;
                        if (answerScaleObj instanceof Number n) {
                            short scaleValue = n.shortValue();
                            if (scaleValue < 1 || scaleValue > 5) {
                                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                        "평점 답변은 1점부터 5점 사이여야 합니다.");
                            }
                            answerScale = scaleValue;
                        }
                        return new ApplicationAnswer(
                                application,
                                question,
                                answerText,
                                answerChoice,
                                answerScale
                        );
                    })
                    .toList();
            applicationAnswerRepository.saveAll(answers);
        }
    }

    private void saveResumeRaw(Application application, Map<String, Object> resumePayload) {
        ApplicationResumeRaw resumeRaw = applicationResumeRawRepository.findById(application.getId())
                .map(existing -> {
                    existing.updatePayload(resumePayload);
                    return existing;
                })
                .orElseGet(() -> new ApplicationResumeRaw(application, resumePayload));
        applicationResumeRawRepository.save(resumeRaw);
    }

    private ApplicationDraftResponse toResponse(Application application, Long jobPostingId) {
        return new ApplicationDraftResponse(
                application.getId(),
                jobPostingId,
                application.getApplicantEmail(),
                application.getStatus(),
                application.getDraftSavedAt(),
                application.getSubmittedAt()
        );
    }
}
