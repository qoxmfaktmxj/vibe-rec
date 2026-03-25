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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "제출 완료된 지원서만 면접을 등록할 수 있습니다.");
        }

        JobPostingStep step = resolveInterviewStep(application, request);

        interviewRepository.findByApplicationIdAndJobPostingStepId(applicationId, step.getId())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 지원서와 전형 단계에는 이미 면접이 등록되어 있습니다.");
                });

        Interview interview = new Interview(application, step, request.scheduledAt(), request.note());
        interviewRepository.save(interview);

        return toInterviewResponse(interview, List.of());
    }

    @Transactional
    public InterviewResponse updateInterview(Long interviewId, UpdateInterviewRequest request) {
        Interview interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "면접 정보를 찾을 수 없습니다."));

        interview.updateStatus(request.status(), request.note());

        List<Evaluation> evaluations = evaluationRepository.findByInterviewIdOrderByCreatedAt(interviewId);
        return toInterviewResponse(interview, evaluations);
    }

    public List<InterviewResponse> getInterviews(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "면접 정보를 찾을 수 없습니다."));

        AdminAccount evaluator = adminAccountRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "평가자 계정을 찾을 수 없습니다."));

        evaluationRepository.findByInterviewIdAndEvaluatorId(interviewId, evaluatorId)
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "해당 면접과 평가자 조합의 평가가 이미 존재합니다.");
                });

        Evaluation evaluation = new Evaluation(interview, evaluatorId, request.score(), request.comment(), request.result());
        evaluationRepository.save(evaluation);

        return toEvaluationResponse(evaluation, evaluator.getDisplayName());
    }

    private JobPostingStep resolveInterviewStep(Application application, CreateInterviewRequest request) {
        if (request.jobPostingStepId() != null) {
            JobPostingStep step = jobPostingStepRepository.findById(request.jobPostingStepId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고 전형 단계를 찾을 수 없습니다."));

            if (!application.getJobPosting().getId().equals(step.getJobPosting().getId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "선택한 면접 단계가 해당 지원서의 공고에 속하지 않습니다."
                );
            }

            return step;
        }

        if (request.stepOrder() != null) {
                    return jobPostingStepRepository.findByJobPostingIdAndStepOrder(
                            application.getJobPosting().getId(),
                            request.stepOrder()
                    )
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "공고 전형 단계를 찾을 수 없습니다."));
        }

        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "전형 단계 정보를 함께 보내야 합니다."
        );
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
