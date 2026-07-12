package com.viberec.api.admin.interview.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.interview.web.CreateEvaluationRequest;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.admin.interview.web.EvaluationResponse;
import com.viberec.api.admin.interview.web.EvaluationCriterionScoreRequest;
import com.viberec.api.admin.interview.web.EvaluationCriterionScoreResponse;
import com.viberec.api.admin.interview.web.InterviewResponse;
import com.viberec.api.admin.interview.web.UpdateInterviewRequest;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.evaluation.domain.Evaluation;
import com.viberec.api.recruitment.evaluation.domain.EvaluationCriterionScore;
import com.viberec.api.recruitment.evaluation.domain.ScorecardCriterion;
import com.viberec.api.recruitment.evaluation.repository.EvaluationCriterionScoreRepository;
import com.viberec.api.recruitment.evaluation.repository.EvaluationRepository;
import com.viberec.api.recruitment.evaluation.repository.ScorecardCriterionRepository;
import com.viberec.api.recruitment.interview.domain.Interview;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.domain.InterviewType;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import java.net.URI;
import java.net.URISyntaxException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminInterviewService {

    private final InterviewRepository interviewRepository;
    private final EvaluationRepository evaluationRepository;
    private final ApplicationRepository applicationRepository;
    private final JobPostingStepRepository jobPostingStepRepository;
    private final AdminAccountRepository adminAccountRepository;
    private final ApplicationEventService applicationEventService;
    private final ScorecardCriterionRepository scorecardCriterionRepository;
    private final EvaluationCriterionScoreRepository evaluationCriterionScoreRepository;

    public AdminInterviewService(
            InterviewRepository interviewRepository,
            EvaluationRepository evaluationRepository,
            ApplicationRepository applicationRepository,
            JobPostingStepRepository jobPostingStepRepository,
            AdminAccountRepository adminAccountRepository,
            ApplicationEventService applicationEventService,
            ScorecardCriterionRepository scorecardCriterionRepository,
            EvaluationCriterionScoreRepository evaluationCriterionScoreRepository
    ) {
        this.interviewRepository = interviewRepository;
        this.evaluationRepository = evaluationRepository;
        this.applicationRepository = applicationRepository;
        this.jobPostingStepRepository = jobPostingStepRepository;
        this.adminAccountRepository = adminAccountRepository;
        this.applicationEventService = applicationEventService;
        this.scorecardCriterionRepository = scorecardCriterionRepository;
        this.evaluationCriterionScoreRepository = evaluationCriterionScoreRepository;
    }

    @Transactional
    public InterviewResponse createInterview(Long applicationId, CreateInterviewRequest request) {
        return createInterview(applicationId, request, "SYSTEM", null);
    }

    @Transactional
    public InterviewResponse createInterview(
            Long applicationId,
            CreateInterviewRequest request,
            String actorType,
            Long actorId
    ) {
        Application application = applicationRepository.findForCommandById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can schedule interviews.");
        }

        JobPostingStep step = resolveInterviewStep(application, request);
        validateInterviewDetails(request);

        interviewRepository.findByApplicationIdAndJobPostingStepId(applicationId, step.getId())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "An interview already exists for this application step.");
                });

        Interview interview = new Interview(
                application,
                step,
                request.interviewType(),
                request.scheduledAt(),
                request.durationMinutes(),
                normalizeOptional(request.location()),
                normalizeOptional(request.onlineLink()),
                normalizeOptional(request.note())
        );
        interviewRepository.save(interview);
        applicationEventService.record(
                application,
                "INTERVIEW_SCHEDULED",
                null,
                InterviewStatus.SCHEDULED.name(),
                actorType,
                actorId,
                request.note(),
                "{\"interviewId\":" + interview.getId() + ",\"jobPostingStepId\":" + step.getId() + "}"
        );

        return toInterviewResponse(interview, List.of(), Map.of(), Map.of());
    }

    @Transactional
    public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest request) {
        return updateInterview(interviewId, request, "SYSTEM", null);
    }

    @Transactional
    public InterviewResponse updateInterview(
            Long interviewId,
            UpdateInterviewRequest request,
            String actorType,
            Long actorId
    ) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));

        InterviewStatus previousStatus = interview.getStatus();
        interview.updateStatus(request.status(), request.note());
        if (previousStatus != request.status()) {
            applicationEventService.record(
                    interview.getApplication(),
                    "INTERVIEW_STATUS_CHANGED",
                    previousStatus.name(),
                    request.status().name(),
                    actorType,
                    actorId,
                    request.note(),
                    "{\"interviewId\":" + interview.getId() + "}"
            );
        }

        List<Evaluation> evaluations = evaluationRepository.findByInterviewIdOrderByCreatedAt(interviewId);
        return toInterviewResponse(
                interview,
                evaluations,
                loadAdminDisplayNames(extractEvaluatorIds(evaluations)),
                loadCriterionScores(evaluations)
        );
    }

    public List<InterviewResponse> getInterviews(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        List<Interview> interviews = interviewRepository.findByApplicationIdOrderByCreatedAt(applicationId);
        List<Evaluation> allEvaluations = evaluationRepository.findByInterviewApplicationIdOrderByCreatedAt(applicationId);
        Map<Long, String> evaluatorNamesById = loadAdminDisplayNames(extractEvaluatorIds(allEvaluations));

        Map<Long, List<Evaluation>> evaluationsByInterview = allEvaluations.stream()
                .collect(Collectors.groupingBy(evaluation -> evaluation.getInterview().getId()));
        Map<Long, List<EvaluationCriterionScore>> criterionScoresByEvaluation = loadCriterionScores(allEvaluations);

        return interviews.stream()
                .map(interview -> toInterviewResponse(
                        interview,
                        evaluationsByInterview.getOrDefault(interview.getId(), List.of()),
                        evaluatorNamesById,
                        criterionScoresByEvaluation
                ))
                .toList();
    }

    @Transactional
    public EvaluationResponse createEvaluation(Long interviewId, Long evaluatorId, CreateEvaluationRequest request) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));

        if (interview.getStatus() != InterviewStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only completed interviews can accept evaluations.");
        }

        AdminAccount evaluator = adminAccountRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluator account not found."));

        evaluationRepository.findByInterviewIdAndEvaluatorId(interviewId, evaluatorId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "An evaluation already exists for this interview and evaluator.");
                });

        ScorecardEvaluation scorecardEvaluation = validateAndCalculateScorecard(interview, request);
        Evaluation evaluation = new Evaluation(
                interview,
                evaluatorId,
                scorecardEvaluation.overallScore(),
                normalizeOptional(request.comment()),
                request.result()
        );
        evaluationRepository.save(evaluation);
        List<EvaluationCriterionScore> criterionScores = scorecardEvaluation.scores().stream()
                .map(score -> new EvaluationCriterionScore(
                        evaluation,
                        score.criterion(),
                        score.request().score(),
                        normalizeOptional(score.request().comment())
                ))
                .toList();
        evaluationCriterionScoreRepository.saveAll(criterionScores);
        applicationEventService.record(
                interview.getApplication(),
                "EVALUATION_CREATED",
                null,
                request.result().name(),
                "ADMIN",
                evaluatorId,
                request.comment(),
                "{\"interviewId\":" + interview.getId()
                        + ",\"evaluationId\":" + evaluation.getId()
                        + ",\"overallScore\":" + scorecardEvaluation.overallScore() + "}"
        );

        return toEvaluationResponse(evaluation, evaluator.getDisplayName(), criterionScores);
    }

    private ScorecardEvaluation validateAndCalculateScorecard(
            Interview interview,
            CreateEvaluationRequest request
    ) {
        List<ScorecardCriterion> criteria = scorecardCriterionRepository
                .findByJobPostingStepIdOrderBySortOrderAscIdAsc(interview.getJobPostingStep().getId());
        if (criteria.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "The interview scorecard has not been configured.");
        }
        if (request.criterionScores() == null || request.criterionScores().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scorecard responses are required.");
        }
        Map<Long, ScorecardCriterion> criteriaById = criteria.stream()
                .collect(Collectors.toMap(ScorecardCriterion::getId, criterion -> criterion));
        Set<Long> submittedIds = new HashSet<>();
        List<ValidatedCriterionScore> scores = new java.util.ArrayList<>();
        long weightedScore = 0;
        long totalWeight = 0;
        for (EvaluationCriterionScoreRequest submitted : request.criterionScores()) {
            if (submitted.criterionId() == null || !submittedIds.add(submitted.criterionId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scorecard criterion responses must be unique.");
            }
            ScorecardCriterion criterion = criteriaById.get(submitted.criterionId());
            if (criterion == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A scorecard criterion does not belong to this interview step.");
            }
            if (submitted.score() < 1 || submitted.score() > 5) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scorecard values must be between 1 and 5.");
            }
            scores.add(new ValidatedCriterionScore(criterion, submitted));
            weightedScore += (long) submitted.score() * criterion.getWeight();
            totalWeight += criterion.getWeight();
        }
        List<String> missingRequired = criteria.stream()
                .filter(ScorecardCriterion::isRequired)
                .filter(criterion -> !submittedIds.contains(criterion.getId()))
                .map(ScorecardCriterion::getName)
                .toList();
        if (!missingRequired.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Required scorecard criteria are missing: " + String.join(", ", missingRequired)
            );
        }
        short overallScore = BigDecimal.valueOf(weightedScore)
                .divide(BigDecimal.valueOf(totalWeight), 0, RoundingMode.HALF_UP)
                .shortValueExact();
        scores.sort(Comparator.comparing(score -> score.criterion().getSortOrder()));
        return new ScorecardEvaluation(overallScore, List.copyOf(scores));
    }

    private JobPostingStep resolveInterviewStep(Application application, CreateInterviewRequest request) {
        if (request.jobPostingStepId() != null) {
            JobPostingStep step = jobPostingStepRepository.findById(request.jobPostingStepId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting step not found."));

            if (!application.getJobPosting().getId().equals(step.getJobPosting().getId())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The selected step does not belong to the application's job posting.");
            }

            validateInterviewStep(step);
            return step;
        }

        if (request.stepOrder() != null) {
            JobPostingStep step = jobPostingStepRepository.findByJobPostingIdAndStepOrder(
                    application.getJobPosting().getId(),
                    request.stepOrder()
            ).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting step not found."));

            validateInterviewStep(step);
            return step;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Interview step information is required.");
    }

    private void validateInterviewStep(JobPostingStep step) {
        if (step.getStepType() != JobPostingStepType.INTERVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only INTERVIEW steps can create interviews.");
        }
    }

    private void validateInterviewDetails(CreateInterviewRequest request) {
        String location = normalizeOptional(request.location());
        String onlineLink = normalizeOptional(request.onlineLink());
        if (request.interviewType() == InterviewType.VIDEO && onlineLink == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Video interviews require an online link.");
        }
        if (request.interviewType() == InterviewType.ONSITE && location == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Onsite interviews require a location.");
        }
        if (request.interviewType() == InterviewType.TECHNICAL && location == null && onlineLink == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Technical interviews require a location or online link.");
        }
        if (onlineLink != null && !isHttpUrl(onlineLink)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The online link must be a valid HTTP or HTTPS URL.");
        }
    }

    private boolean isHttpUrl(String value) {
        try {
            URI uri = new URI(value);
            return ("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme()))
                    && uri.getHost() != null;
        } catch (URISyntaxException exception) {
            return false;
        }
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private Collection<Long> extractEvaluatorIds(List<Evaluation> evaluations) {
        return evaluations.stream()
                .map(Evaluation::getEvaluatorId)
                .distinct()
                .toList();
    }

    private Map<Long, String> loadAdminDisplayNames(Collection<Long> adminIds) {
        if (adminIds.isEmpty()) {
            return Map.of();
        }

        return adminAccountRepository.findAllById(adminIds).stream()
                .collect(Collectors.toMap(AdminAccount::getId, AdminAccount::getDisplayName));
    }

    private Map<Long, List<EvaluationCriterionScore>> loadCriterionScores(List<Evaluation> evaluations) {
        if (evaluations.isEmpty()) {
            return Map.of();
        }
        return evaluationCriterionScoreRepository.findByEvaluationIds(
                        evaluations.stream().map(Evaluation::getId).toList()
                ).stream()
                .collect(Collectors.groupingBy(score -> score.getEvaluation().getId()));
    }

    private InterviewResponse toInterviewResponse(
            Interview interview,
            List<Evaluation> evaluations,
            Map<Long, String> evaluatorNamesById,
            Map<Long, List<EvaluationCriterionScore>> criterionScoresByEvaluation
    ) {
        JobPostingStep step = interview.getJobPostingStep();

        List<EvaluationResponse> evaluationResponses = evaluations.stream()
                .map(evaluation -> toEvaluationResponse(
                        evaluation,
                        evaluatorNamesById.getOrDefault(evaluation.getEvaluatorId(), "Unknown"),
                        criterionScoresByEvaluation.getOrDefault(evaluation.getId(), List.of())
                ))
                .toList();

        return new InterviewResponse(
                interview.getId(),
                interview.getApplication().getId(),
                step.getId(),
                step.getTitle(),
                step.getStepType(),
                interview.getInterviewType(),
                interview.getScheduledAt(),
                interview.getDurationMinutes(),
                interview.getLocation(),
                interview.getOnlineLink(),
                interview.getStatus(),
                interview.getNote(),
                interview.getCreatedAt(),
                interview.getUpdatedAt(),
                evaluationResponses
        );
    }

    private EvaluationResponse toEvaluationResponse(
            Evaluation evaluation,
            String evaluatorName,
            List<EvaluationCriterionScore> criterionScores
    ) {
        return new EvaluationResponse(
                evaluation.getId(),
                evaluation.getInterview().getId(),
                evaluation.getEvaluatorId(),
                evaluatorName,
                evaluation.getScore(),
                evaluation.getComment(),
                evaluation.getResult(),
                evaluation.getCreatedAt(),
                criterionScores.stream()
                        .sorted(Comparator.comparing(score -> score.getCriterion().getSortOrder()))
                        .map(score -> new EvaluationCriterionScoreResponse(
                                score.getCriterion().getId(),
                                score.getCriterion().getName(),
                                score.getCriterion().getWeight(),
                                score.getCriterion().isRequired(),
                                score.getScore(),
                                score.getComment()
                        ))
                        .toList()
        );
    }

    private record ValidatedCriterionScore(
            ScorecardCriterion criterion,
            EvaluationCriterionScoreRequest request
    ) {
    }

    private record ScorecardEvaluation(
            short overallScore,
            List<ValidatedCriterionScore> scores
    ) {
    }
}
