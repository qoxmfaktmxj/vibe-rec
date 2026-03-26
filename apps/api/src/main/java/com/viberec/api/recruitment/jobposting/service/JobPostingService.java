package com.viberec.api.recruitment.jobposting.service;

import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.domain.QuestionType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.jobposting.web.JobPostingDetailResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingQuestionResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingSummaryResponse;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.jobposting.web.SaveJobPostingQuestionRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingQuestionRepository jobPostingQuestionRepository;
    private final ApplicationRepository applicationRepository;

    public JobPostingService(
            JobPostingRepository jobPostingRepository,
            JobPostingQuestionRepository jobPostingQuestionRepository,
            ApplicationRepository applicationRepository
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.jobPostingQuestionRepository = jobPostingQuestionRepository;
        this.applicationRepository = applicationRepository;
    }

    public List<JobPostingSummaryResponse> getPublishedJobPostings() {
        return jobPostingRepository.findByPublishedTrueOrderByOpensAtDesc().stream()
                .map(this::toSummaryResponse)
                .toList();
    }

    public JobPostingDetailResponse getJobPosting(Long id) {
        JobPosting jobPosting = jobPostingRepository.findWithStepsById(id)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        return new JobPostingDetailResponse(
                jobPosting.getId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getDescription(),
                jobPosting.getEmploymentType(),
                jobPosting.getRecruitmentCategory(),
                jobPosting.getRecruitmentMode(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt(),
                jobPosting.getSteps().stream().map(this::toStepResponse).toList()
        );
    }

    @Transactional(readOnly = true)
    public List<JobPostingQuestionResponse> getQuestionsForJobPosting(Long jobPostingId) {
        jobPostingRepository.findById(jobPostingId)
                .filter(JobPosting::isPublished)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found"));
        return jobPostingQuestionRepository.findByJobPostingIdOrderBySortOrder(jobPostingId).stream()
                .map(q -> new JobPostingQuestionResponse(
                        q.getId(),
                        q.getQuestionText(),
                        q.getQuestionType().name(),
                        q.getChoices(),
                        q.isRequired(),
                        q.getSortOrder()
                ))
                .toList();
    }

    @Transactional
    public void saveQuestionsForJobPosting(Long jobPostingId, List<SaveJobPostingQuestionRequest> requests) {
        JobPosting jobPosting = jobPostingRepository.findById(jobPostingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
        long submittedAnswerCount = applicationRepository.countSubmittedApplicationsWithAnswers(jobPostingId);
        if (submittedAnswerCount > 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot modify questions: " + submittedAnswerCount + " submitted application(s) have existing answers.");
        }
        jobPostingQuestionRepository.deleteByJobPostingId(jobPostingId);
        jobPostingQuestionRepository.saveAll(requests.stream()
                .map(req -> {
                    QuestionType type;
                    try {
                        type = QuestionType.valueOf(req.questionType());
                    } catch (IllegalArgumentException ex) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                "Invalid question type: " + req.questionType());
                    }
                    return new JobPostingQuestion(
                            jobPosting,
                            req.questionText(),
                            type,
                            req.choices(),
                            req.required(),
                            req.sortOrder()
                    );
                })
                .toList());
    }

    private JobPostingSummaryResponse toSummaryResponse(JobPosting jobPosting) {
        return new JobPostingSummaryResponse(
                jobPosting.getId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getEmploymentType(),
                jobPosting.getRecruitmentCategory(),
                jobPosting.getRecruitmentMode(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt(),
                jobPosting.getSteps().size()
        );
    }

    private JobPostingStepResponse toStepResponse(JobPostingStep step) {
        return new JobPostingStepResponse(
                step.getId(),
                step.getStepOrder(),
                step.getStepType(),
                step.getTitle(),
                step.getDescription(),
                step.getStartsAt(),
                step.getEndsAt()
        );
    }
}
