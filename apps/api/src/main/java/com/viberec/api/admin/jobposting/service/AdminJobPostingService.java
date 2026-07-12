package com.viberec.api.admin.jobposting.service;

import com.viberec.api.admin.jobposting.web.AdminJobPostingResponse;
import com.viberec.api.admin.jobposting.web.AdminJobPostingPreviewResponse;
import com.viberec.api.admin.jobposting.web.AdminJobPostingUpsertRequest;
import com.viberec.api.admin.jobposting.web.JobPostingPublicationState;
import com.viberec.api.admin.jobposting.web.ScheduleJobPostingPublicationRequest;
import com.viberec.api.recruitment.evaluation.domain.ScorecardCriterion;
import com.viberec.api.recruitment.evaluation.repository.ScorecardCriterionRepository;
import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStatus;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import com.viberec.api.recruitment.jobposting.domain.RecruitmentMode;
import com.viberec.api.recruitment.jobposting.repository.JobPostingQuestionRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingRepository;
import com.viberec.api.recruitment.jobposting.repository.JobPostingStepRepository;
import com.viberec.api.recruitment.jobposting.web.JobPostingQuestionResponse;
import com.viberec.api.recruitment.jobposting.web.JobPostingStepResponse;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminJobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final JobPostingStepRepository jobPostingStepRepository;
    private final JobPostingQuestionRepository jobPostingQuestionRepository;
    private final ScorecardCriterionRepository scorecardCriterionRepository;

    public AdminJobPostingService(
            JobPostingRepository jobPostingRepository,
            JobPostingStepRepository jobPostingStepRepository,
            JobPostingQuestionRepository jobPostingQuestionRepository,
            ScorecardCriterionRepository scorecardCriterionRepository
    ) {
        this.jobPostingRepository = jobPostingRepository;
        this.jobPostingStepRepository = jobPostingStepRepository;
        this.jobPostingQuestionRepository = jobPostingQuestionRepository;
        this.scorecardCriterionRepository = scorecardCriterionRepository;
    }

    public AdminJobPostingResponse getJobPosting(Long id) {
        return jobPostingRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
    }

    public java.util.List<AdminJobPostingResponse> getJobPostings() {
        return jobPostingRepository.findAllByOrderByOpensAtDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    public AdminJobPostingPreviewResponse getPreview(Long id) {
        JobPosting jobPosting = jobPostingRepository.findWithStepsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
        List<JobPostingQuestionResponse> questions = jobPostingQuestionRepository
                .findByJobPostingIdOrderBySortOrder(id)
                .stream()
                .map(this::toQuestionResponse)
                .toList();
        return new AdminJobPostingPreviewResponse(
                toResponse(jobPosting),
                jobPosting.getSteps().stream().map(this::toStepResponse).toList(),
                questions
        );
    }

    @Transactional
    public AdminJobPostingResponse createJobPosting(AdminJobPostingUpsertRequest request) {
        validateRequest(request, null);

        JobPosting jobPosting = new JobPosting(
                request.legacyAnnoId(),
                request.publicKey().trim(),
                request.title().trim(),
                request.headline().trim(),
                request.description().trim(),
                request.employmentType().trim(),
                request.recruitmentCategory(),
                request.recruitmentMode(),
                request.location().trim(),
                request.status(),
                request.published(),
                request.opensAt(),
                normalizeClosesAt(request)
        );

        return toResponse(jobPostingRepository.save(jobPosting));
    }

    @Transactional
    public AdminJobPostingResponse updateJobPosting(Long id, AdminJobPostingUpsertRequest request) {
        validateRequest(request, id);

        JobPosting jobPosting = jobPostingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));

        jobPosting.updatePosting(
                request.legacyAnnoId(),
                request.publicKey().trim(),
                request.title().trim(),
                request.headline().trim(),
                request.description().trim(),
                request.employmentType().trim(),
                request.recruitmentCategory(),
                request.recruitmentMode(),
                request.location().trim(),
                request.status(),
                request.published(),
                request.opensAt(),
                normalizeClosesAt(request)
        );

        return toResponse(jobPosting);
    }

    @Transactional
    public AdminJobPostingResponse cloneJobPosting(Long id) {
        JobPosting source = jobPostingRepository.findWithStepsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
        JobPosting clone = new JobPosting(
                null,
                nextCopyPublicKey(source.getPublicKey()),
                copyTitle(source.getTitle()),
                source.getHeadline(),
                source.getDescription(),
                source.getEmploymentType(),
                source.getRecruitmentCategory(),
                source.getRecruitmentMode(),
                source.getLocation(),
                JobPostingStatus.DRAFT,
                false,
                source.getOpensAt(),
                source.getClosesAt()
        );
        jobPostingRepository.save(clone);

        Map<Long, JobPostingStep> clonedStepsBySourceId = new LinkedHashMap<>();
        for (JobPostingStep sourceStep : source.getSteps()) {
            JobPostingStep clonedStep = new JobPostingStep(
                    clone,
                    sourceStep.getStepOrder(),
                    sourceStep.getStepType(),
                    sourceStep.getTitle(),
                    sourceStep.getDescription(),
                    sourceStep.getStartsAt(),
                    sourceStep.getEndsAt()
            );
            jobPostingStepRepository.save(clonedStep);
            clonedStepsBySourceId.put(sourceStep.getId(), clonedStep);
        }

        List<JobPostingQuestion> clonedQuestions = jobPostingQuestionRepository
                .findByJobPostingIdOrderBySortOrder(id)
                .stream()
                .map(question -> new JobPostingQuestion(
                        clone,
                        question.getQuestionText(),
                        question.getQuestionType(),
                        question.getChoices(),
                        question.isRequired(),
                        question.getSortOrder()
                ))
                .toList();
        jobPostingQuestionRepository.saveAll(clonedQuestions);

        List<ScorecardCriterion> clonedCriteria = source.getSteps().stream()
                .flatMap(sourceStep -> scorecardCriterionRepository
                        .findByJobPostingStepIdOrderBySortOrderAscIdAsc(sourceStep.getId())
                        .stream()
                        .map(criterion -> new ScorecardCriterion(
                                clonedStepsBySourceId.get(sourceStep.getId()),
                                criterion.getName(),
                                criterion.getNormalizedName(),
                                criterion.getDescription(),
                                criterion.getWeight(),
                                criterion.isRequired(),
                                criterion.getSortOrder()
                        )))
                .toList();
        scorecardCriterionRepository.saveAll(clonedCriteria);

        return toResponse(clone);
    }

    @Transactional
    public AdminJobPostingResponse schedulePublication(
            Long id,
            ScheduleJobPostingPublicationRequest request
    ) {
        JobPosting jobPosting = jobPostingRepository.findWithStepsById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Job posting not found."));
        OffsetDateTime now = OffsetDateTime.now();
        if (jobPosting.isPublished() && !now.isBefore(jobPosting.getOpensAt())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "A currently published job posting cannot be rescheduled. Unpublish it first."
            );
        }
        jobPosting.schedulePublication(request.publishAt());
        return toResponse(jobPosting);
    }

    private void validateRequest(AdminJobPostingUpsertRequest request, Long existingId) {
        String publicKey = trimRequired(request.publicKey(), "Public key is required.");
        trimRequired(request.title(), "Title is required.");
        trimRequired(request.headline(), "Headline is required.");
        trimRequired(request.description(), "Description is required.");
        trimRequired(request.employmentType(), "Employment type is required.");
        trimRequired(request.location(), "Location is required.");

        if (request.opensAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Open date is required.");
        }
        if (request.recruitmentCategory() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recruitment category is required.");
        }
        if (request.recruitmentMode() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Recruitment mode is required.");
        }
        if (request.status() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required.");
        }
        if (request.published() && request.status() == JobPostingStatus.DRAFT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Draft job postings cannot be published.");
        }

        if (existingId == null) {
            if (jobPostingRepository.existsByPublicKey(publicKey)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Public key already exists.");
            }
        } else if (jobPostingRepository.existsByPublicKeyAndIdNot(publicKey, existingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Public key already exists.");
        }

        OffsetDateTime closesAt = request.closesAt();
        if (request.recruitmentMode() == RecruitmentMode.ROLLING) {
            if (closesAt != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Rolling recruitment must not have closesAt.");
            }
            return;
        }

        if (closesAt == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fixed-term recruitment requires closesAt.");
        }

        if (!closesAt.isAfter(request.opensAt())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "closesAt must be after opensAt.");
        }
    }

    private String trimRequired(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }

        return value.trim();
    }

    private OffsetDateTime normalizeClosesAt(AdminJobPostingUpsertRequest request) {
        return request.recruitmentMode() == RecruitmentMode.ROLLING ? null : request.closesAt();
    }

    private AdminJobPostingResponse toResponse(JobPosting jobPosting) {
        OffsetDateTime now = OffsetDateTime.now();
        return new AdminJobPostingResponse(
                jobPosting.getId(),
                jobPosting.getLegacyAnnoId(),
                jobPosting.getPublicKey(),
                jobPosting.getTitle(),
                jobPosting.getHeadline(),
                jobPosting.getDescription(),
                jobPosting.getEmploymentType(),
                jobPosting.getRecruitmentCategory(),
                jobPosting.getRecruitmentMode(),
                jobPosting.getLocation(),
                jobPosting.getStatus(),
                jobPosting.isPublished(),
                jobPosting.getOpensAt(),
                jobPosting.getClosesAt(),
                publicationState(jobPosting, now)
        );
    }

    private JobPostingPublicationState publicationState(JobPosting jobPosting, OffsetDateTime now) {
        if (jobPosting.getStatus() == JobPostingStatus.CLOSED
                || (jobPosting.getClosesAt() != null && now.isAfter(jobPosting.getClosesAt()))) {
            return JobPostingPublicationState.CLOSED;
        }
        if (!jobPosting.isPublished() || jobPosting.getStatus() == JobPostingStatus.DRAFT) {
            return JobPostingPublicationState.DRAFT;
        }
        if (now.isBefore(jobPosting.getOpensAt())) {
            return JobPostingPublicationState.SCHEDULED;
        }
        return JobPostingPublicationState.PUBLISHED;
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

    private JobPostingQuestionResponse toQuestionResponse(JobPostingQuestion question) {
        return new JobPostingQuestionResponse(
                question.getId(),
                question.getQuestionText(),
                question.getQuestionType().name(),
                question.getChoices(),
                question.isRequired(),
                question.getSortOrder()
        );
    }

    private String nextCopyPublicKey(String sourcePublicKey) {
        String stem = sourcePublicKey.length() > 68 ? sourcePublicKey.substring(0, 68) : sourcePublicKey;
        String candidate = stem + "-copy";
        int suffix = 2;
        while (jobPostingRepository.existsByPublicKey(candidate)) {
            candidate = stem + "-copy-" + suffix++;
        }
        return candidate;
    }

    private String copyTitle(String sourceTitle) {
        String title = sourceTitle.length() > 190 ? sourceTitle.substring(0, 190) : sourceTitle;
        return title + " (Copy)";
    }
}
