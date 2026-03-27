package com.viberec.api.recruitment.application.service;

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
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ApplicationDraftService {

    private final JobPostingRepository jobPostingRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;
    private final ResumeNormalizationService resumeNormalizationService;
    private final ApplicationAnswerRepository applicationAnswerRepository;
    private final JobPostingQuestionRepository jobPostingQuestionRepository;

    public ApplicationDraftService(
            JobPostingRepository jobPostingRepository,
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService,
            ApplicationAnswerRepository applicationAnswerRepository,
            JobPostingQuestionRepository jobPostingQuestionRepository
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
        this.applicationAnswerRepository = applicationAnswerRepository;
        this.jobPostingQuestionRepository = jobPostingQuestionRepository;
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
        validateSubmitPayload(request.resumePayload());

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
        return toResponse(savedApplication, jobPostingId);
    }

    private JobPosting loadActiveJobPosting(Long jobPostingId) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고를 찾을 수 없습니다."));
        validateApplicationWindow(jobPosting);
        return jobPosting;
    }

    private void validateApplicationWindow(JobPosting jobPosting) {
        OffsetDateTime now = OffsetDateTime.now();
        if (!jobPosting.isAcceptingApplicationsAt(now)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "공고가 열려 있는 동안에만 지원서를 저장하거나 제출할 수 있습니다.");
        }
    }

    private void ensureEditable(Application application) {
        if (application.isSubmitted()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 제출된 지원서입니다.");
        }
    }

    private void validateSubmitPayload(Map<String, Object> resumePayload) {
        String introduction = readPayloadText(resumePayload, "introduction");
        if (introduction == null || introduction.length() < 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "자기소개는 20자 이상 입력해 주세요.");
        }

        String coreStrength = readPayloadText(resumePayload, "coreStrength");
        if (coreStrength == null || coreStrength.length() < 10) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "핵심 역량은 10자 이상 입력해 주세요.");
        }
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
