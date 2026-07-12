package com.viberec.api.admin.interview.service;

import com.viberec.api.admin.interview.web.ReplaceScorecardCriteriaRequest;
import com.viberec.api.admin.interview.web.ScorecardCriterionInput;
import com.viberec.api.admin.interview.web.ScorecardCriterionResponse;
import com.viberec.api.recruitment.evaluation.domain.ScorecardCriterion;
import com.viberec.api.recruitment.evaluation.repository.EvaluationRepository;
import com.viberec.api.recruitment.evaluation.repository.ScorecardCriterionRepository;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStepType;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminScorecardService {

    private final JobPostingStepRepository jobPostingStepRepository;
    private final ScorecardCriterionRepository scorecardCriterionRepository;
    private final EvaluationRepository evaluationRepository;

    public AdminScorecardService(
            JobPostingStepRepository jobPostingStepRepository,
            ScorecardCriterionRepository scorecardCriterionRepository,
            EvaluationRepository evaluationRepository
    ) {
        this.jobPostingStepRepository = jobPostingStepRepository;
        this.scorecardCriterionRepository = scorecardCriterionRepository;
        this.evaluationRepository = evaluationRepository;
    }

    public List<ScorecardCriterionResponse> getCriteria(Long jobPostingId, Long stepId) {
        JobPostingStep step = loadInterviewStep(jobPostingId, stepId);
        return scorecardCriterionRepository.findByJobPostingStepIdOrderBySortOrderAscIdAsc(step.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<ScorecardCriterionResponse> replaceCriteria(
            Long jobPostingId,
            Long stepId,
            ReplaceScorecardCriteriaRequest request
    ) {
        JobPostingStep step = loadInterviewStep(jobPostingId, stepId);
        if (evaluationRepository.existsByInterviewJobPostingStepId(stepId)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Scorecard criteria cannot change after an evaluation has been submitted."
            );
        }
        validateCriteria(request.criteria());
        scorecardCriterionRepository.deleteByStepId(stepId);

        List<ScorecardCriterion> criteria = new java.util.ArrayList<>();
        for (int index = 0; index < request.criteria().size(); index++) {
            ScorecardCriterionInput input = request.criteria().get(index);
            String name = normalizeRequired(input.name());
            criteria.add(new ScorecardCriterion(
                    step,
                    name,
                    name.toLowerCase(Locale.ROOT),
                    normalizeOptional(input.description()),
                    input.weight(),
                    input.required(),
                    (short) index
            ));
        }
        return scorecardCriterionRepository.saveAll(criteria).stream().map(this::toResponse).toList();
    }

    private JobPostingStep loadInterviewStep(Long jobPostingId, Long stepId) {
        JobPostingStep step = jobPostingStepRepository.findById(stepId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting step not found."));
        if (!step.getJobPosting().getId().equals(jobPostingId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The step does not belong to this job posting.");
        }
        if (step.getStepType() != JobPostingStepType.INTERVIEW) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only interview steps can have scorecards.");
        }
        return step;
    }

    private void validateCriteria(List<ScorecardCriterionInput> criteria) {
        if (criteria == null || criteria.isEmpty() || criteria.size() > 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A scorecard requires between 1 and 20 criteria.");
        }
        if (criteria.stream().noneMatch(ScorecardCriterionInput::required)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A scorecard requires at least one required criterion.");
        }
        Set<String> names = new HashSet<>();
        for (ScorecardCriterionInput input : criteria) {
            String normalizedName = normalizeRequired(input.name()).toLowerCase(Locale.ROOT);
            if (!names.add(normalizedName)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scorecard criterion names must be unique.");
            }
            if (input.weight() < 1 || input.weight() > 100) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Scorecard weights must be between 1 and 100.");
            }
        }
    }

    private String normalizeRequired(String value) {
        String normalized = value == null ? "" : value.trim().replaceAll("\\s+", " ");
        if (normalized.isEmpty() || normalized.length() > 120) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid scorecard criterion name.");
        }
        return normalized;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private ScorecardCriterionResponse toResponse(ScorecardCriterion criterion) {
        return new ScorecardCriterionResponse(
                criterion.getId(),
                criterion.getJobPostingStep().getId(),
                criterion.getName(),
                criterion.getDescription(),
                criterion.getWeight(),
                criterion.isRequired(),
                criterion.getSortOrder()
        );
    }
}
