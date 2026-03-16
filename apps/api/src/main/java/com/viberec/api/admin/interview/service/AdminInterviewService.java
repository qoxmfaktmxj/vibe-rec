package com.viberec.api.admin.interview.service;

import com.viberec.api.admin.interview.web.AddEvaluatorRequest;
import com.viberec.api.admin.interview.web.InterviewResponse;
import com.viberec.api.admin.interview.web.ScheduleInterviewRequest;
import com.viberec.api.admin.interview.web.SubmitEvaluationRequest;
import com.viberec.api.admin.interview.web.UpdateInterviewStatusRequest;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.interview.domain.Interview;
import com.viberec.api.recruitment.interview.domain.InterviewEvaluator;
import com.viberec.api.recruitment.interview.repository.InterviewEvaluatorRepository;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminInterviewService {

    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final InterviewEvaluatorRepository interviewEvaluatorRepository;

    public AdminInterviewService(
            ApplicationRepository applicationRepository,
            InterviewRepository interviewRepository,
            InterviewEvaluatorRepository interviewEvaluatorRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.interviewEvaluatorRepository = interviewEvaluatorRepository;
    }

    public List<InterviewResponse> getInterviews(Long applicationId) {
        return interviewRepository.findByApplicationIdOrderByScheduledAtDesc(applicationId).stream()
                .map(this::toResponse)
                .toList();
    }

    public InterviewResponse getInterview(Long interviewId) {
        Interview interview = loadInterview(interviewId);
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse scheduleInterview(Long applicationId, ScheduleInterviewRequest request) {
        Application application = applicationRepository.findWithJobPostingById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Applicant not found."));

        if (application.getReviewStatus() != ApplicationReviewStatus.PASSED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only PASSED applicants can be scheduled for an interview.");
        }

        Interview interview = new Interview(
                application,
                request.interviewType(),
                request.scheduledAt(),
                request.durationMinutes(),
                request.location(),
                request.onlineLink(),
                request.note()
        );
        interviewRepository.save(interview);
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse updateStatus(Long interviewId, UpdateInterviewStatusRequest request) {
        Interview interview = loadInterview(interviewId);
        interview.updateStatus(request.status());
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse addEvaluator(Long interviewId, AddEvaluatorRequest request) {
        Interview interview = loadInterview(interviewId);
        InterviewEvaluator evaluator = new InterviewEvaluator(interview, request.evaluatorName());
        interviewEvaluatorRepository.save(evaluator);
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse removeEvaluator(Long interviewId, Long evaluatorId) {
        loadInterview(interviewId);
        InterviewEvaluator evaluator = interviewEvaluatorRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluator not found."));
        if (!evaluator.getInterview().getId().equals(interviewId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evaluator does not belong to this interview.");
        }
        interviewEvaluatorRepository.delete(evaluator);
        Interview interview = loadInterview(interviewId);
        return toResponse(interview);
    }

    @Transactional
    public InterviewResponse submitEvaluation(Long interviewId, Long evaluatorId, SubmitEvaluationRequest request) {
        loadInterview(interviewId);
        InterviewEvaluator evaluator = interviewEvaluatorRepository.findById(evaluatorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Evaluator not found."));
        if (!evaluator.getInterview().getId().equals(interviewId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Evaluator does not belong to this interview.");
        }
        evaluator.submitScore(request.score(), request.comment(), request.result());
        Interview interview = loadInterview(interviewId);
        return toResponse(interview);
    }

    private Interview loadInterview(Long interviewId) {
        return interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Interview not found."));
    }

    private InterviewResponse toResponse(Interview interview) {
        List<InterviewResponse.EvaluatorResponse> evaluators =
                interviewEvaluatorRepository.findByInterviewIdOrderByCreatedAtAsc(interview.getId()).stream()
                        .map(e -> new InterviewResponse.EvaluatorResponse(
                                e.getId(),
                                e.getEvaluatorName(),
                                e.getScore(),
                                e.getComment(),
                                e.getResult().name(),
                                e.getEvaluatedAt()
                        ))
                        .toList();

        return new InterviewResponse(
                interview.getId(),
                interview.getApplication().getId(),
                interview.getInterviewType(),
                interview.getScheduledAt(),
                interview.getDurationMinutes(),
                interview.getLocation(),
                interview.getOnlineLink(),
                interview.getStatus(),
                interview.getNote(),
                interview.getCreatedAt(),
                evaluators
        );
    }
}
