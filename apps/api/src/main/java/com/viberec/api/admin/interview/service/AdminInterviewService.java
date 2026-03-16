package com.viberec.api.admin.interview.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.interview.web.CreateEvaluationRequest;
import com.viberec.api.admin.interview.web.CreateInterviewRequest;
import com.viberec.api.admin.interview.web.EvaluationResponse;
import com.viberec.api.admin.interview.web.InterviewResponse;
import com.viberec.api.admin.interview.web.UpdateInterviewRequest;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.evaluation.domain.Evaluation;
import com.viberec.api.recruitment.evaluation.repository.EvaluationRepository;
import com.viberec.api.recruitment.interview.domain.Interview;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import java.util.List;
import java.util.Map;
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

    public AdminInterviewService(
            InterviewRepository interviewRepository,
            EvaluationRepository evaluationRepository,
            ApplicationRepository applicationRepository,
            JobPostingStepRepository jobPostingStepRepository,
            AdminAccountRepository adminAccountRepository
    ) {
        this.interviewRepository = interviewRepository;
        this.evaluationRepository = evaluationRepository;
        this.applicationRepository = applicationRepository;
        this.jobPostingStepRepository = jobPostingStepRepository;
        this.adminAccountRepository = adminAccountRepository;
    }

    @Transactional
    public InterviewResponse createInterview(Long applicationId, CreateInterviewRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can have interviews.");
        }

        JobPostingStep step = jobPostingStepRepository.findById(request.jobPostingStepId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting step not found."));

        interviewRepository.findByApplicationIdAndJobPostingStepId(applicationId, request.jobPostingStepId())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Interview already exists for this application and step.");
                });

        Interview interview = new Interview(application, step, request.scheduledAt(), request.note());
        interviewRepository.save(interview);

        return toInterviewResponse(interview, List.of());
    }

    @Transactional
    public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest request) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));

        interview.updateStatus(request.status(), request.note());

        List<Evaluation> evaluations = evaluationRepository.findByInterviewIdOrderByCreatedAt(interviewId);
        return toInterviewResponse(interview, evaluations);
    }

    public List<InterviewResponse> getInterviews(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        List<Interview> interviews = interviewRepository.findByApplicationIdOrderByCreatedAt(applicationId);
        List<Evaluation> allEvaluations = evaluationRepository.findByInterviewApplicationIdOrderByCreatedAt(applicationId);

        Map<Long, List<Evaluation>> evaluationsByInterview = allEvaluations.stream()
                .collect(Collectors.groupingBy(evaluation -> evaluation.getInterview().getId()));

        return interviews.stream()
                .map(interview -> toInterviewResponse(
                        interview,
                        evaluationsByInterview.getOrDefault(interview.getId(), List.of())
                ))
                .toList();
    }

    @Transactional
    public EvaluationResponse createEvaluation(Long interviewId, Long evaluatorId, CreateEvaluationRequest request) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));

        AdminAccount evaluator = adminAccountRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluator account not found."));

        evaluationRepository.findByInterviewIdAndEvaluatorId(interviewId, evaluatorId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Evaluation already exists for this interview and evaluator.");
                });

        Evaluation evaluation = new Evaluation(interview, evaluatorId, request.score(), request.comment(), request.result());
        evaluationRepository.save(evaluation);

        return toEvaluationResponse(evaluation, evaluator.getDisplayName());
    }

    private InterviewResponse toInterviewResponse(Interview interview, List<Evaluation> evaluations) {
        JobPostingStep step = interview.getJobPostingStep();

        List<EvaluationResponse> evaluationResponses = evaluations.stream()
                .map(evaluation -> {
                    String evaluatorName = adminAccountRepository.findById(evaluation.getEvaluatorId())
                            .map(AdminAccount::getDisplayName)
                            .orElse("Unknown");
                    return toEvaluationResponse(evaluation, evaluatorName);
                })
                .toList();

        return new InterviewResponse(
                interview.getId(),
                interview.getApplication().getId(),
                step.getId(),
                step.getTitle(),
                step.getStepType(),
                interview.getScheduledAt(),
                interview.getStatus(),
                interview.getNote(),
                interview.getCreatedAt(),
                interview.getUpdatedAt(),
                evaluationResponses
        );
    }

    private EvaluationResponse toEvaluationResponse(Evaluation evaluation, String evaluatorName) {
        return new EvaluationResponse(
                evaluation.getId(),
                evaluation.getInterview().getId(),
                evaluation.getEvaluatorId(),
                evaluatorName,
                evaluation.getScore(),
                evaluation.getComment(),
                evaluation.getResult(),
                evaluation.getCreatedAt()
        );
    }
}
