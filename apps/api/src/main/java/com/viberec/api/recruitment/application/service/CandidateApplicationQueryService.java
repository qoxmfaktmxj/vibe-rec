package com.viberec.api.recruitment.application.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationResumeRaw;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.domain.CandidateNextAction;
import com.viberec.api.recruitment.application.domain.CandidateVisibleStage;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.web.ApplicationAnswerDto;
import com.viberec.api.recruitment.application.web.CandidateApplicationDetailResponse;
import com.viberec.api.recruitment.application.web.CandidateApplicationSummaryResponse;
import com.viberec.api.recruitment.application.web.CandidateInterviewResponse;
import com.viberec.api.recruitment.interview.domain.Interview;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateApplicationQueryService {

    private final ApplicationRepository applicationRepository;
    private final ApplicationResumeRawRepository applicationResumeRawRepository;
    private final ResumeNormalizationService resumeNormalizationService;
    private final ApplicationAnswerRepository applicationAnswerRepository;
    private final InterviewRepository interviewRepository;

    public CandidateApplicationQueryService(
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService,
            ApplicationAnswerRepository applicationAnswerRepository,
            InterviewRepository interviewRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
        this.applicationAnswerRepository = applicationAnswerRepository;
        this.interviewRepository = interviewRepository;
    }

    public CandidateApplicationDetailResponse getCandidateApplication(Long jobPostingId, CandidateAccount candidateAccount) {
        Application application = applicationRepository
                .findWithJobPostingByJobPostingIdAndCandidateAccountId(jobPostingId, candidateAccount.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        Map<String, Object> resumePayload = applicationResumeRawRepository.findById(application.getId())
                .map(ApplicationResumeRaw::getPayload)
                .orElseGet(Map::of);

        List<ApplicationAnswerDto> answers = applicationAnswerRepository.findByApplicationId(application.getId())
                .stream()
                .map(a -> new ApplicationAnswerDto(
                        a.getJobPostingQuestion().getId(),
                        a.getAnswerText(),
                        a.getAnswerChoice(),
                        a.getAnswerScale()))
                .toList();
        List<Interview> interviews = interviewRepository.findByApplicationIdOrderByCreatedAt(application.getId());
        CandidateProgress progress = resolveProgress(application, interviews);

        return new CandidateApplicationDetailResponse(
                application.getId(),
                application.getJobPosting().getId(),
                application.getJobPosting().getTitle(),
                application.getApplicantName(),
                application.getApplicantEmail(),
                application.getApplicantPhone(),
                application.getStatus(),
                application.getReviewStatus(),
                application.getFinalStatus(),
                progress.stage(),
                progress.nextAction(),
                progress.lastChangedAt(),
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                application.getFinalDecidedAt(),
                application.getWithdrawnAt(),
                application.getWithdrawalReason(),
                resumePayload,
                resumeNormalizationService.getEducations(application.getId()),
                resumeNormalizationService.getExperiences(application.getId()),
                resumeNormalizationService.getSkills(application.getId()),
                resumeNormalizationService.getCertifications(application.getId()),
                resumeNormalizationService.getLanguages(application.getId()),
                application.getCurrentStep(),
                application.getMotivationFit(),
                answers,
                interviews.stream()
                        .map(interview -> new CandidateInterviewResponse(
                                interview.getId(),
                                interview.getJobPostingStep().getTitle(),
                                interview.getInterviewType(),
                                interview.getScheduledAt(),
                                interview.getDurationMinutes(),
                                interview.getLocation(),
                                interview.getOnlineLink(),
                                interview.getStatus()
                        ))
                        .toList()
        );
    }

    public List<CandidateApplicationSummaryResponse> getCandidateApplications(CandidateAccount candidateAccount) {
        List<Application> applications = applicationRepository
                .findAllWithJobPostingByCandidateAccountId(candidateAccount.getId());
        if (applications.isEmpty()) {
            return List.of();
        }
        Map<Long, List<Interview>> interviewsByApplicationId = interviewRepository
                .findByApplicationIdIn(applications.stream().map(Application::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(interview -> interview.getApplication().getId()));

        return applications.stream()
                .map(application -> {
                    CandidateProgress progress = resolveProgress(
                            application,
                            interviewsByApplicationId.getOrDefault(application.getId(), List.of())
                    );
                    return new CandidateApplicationSummaryResponse(
                        application.getId(),
                        application.getJobPosting().getId(),
                        application.getJobPosting().getPublicKey(),
                        application.getJobPosting().getTitle(),
                        application.getJobPosting().getHeadline(),
                        application.getJobPosting().getEmploymentType(),
                        application.getJobPosting().getLocation(),
                        application.getStatus(),
                        application.getReviewStatus(),
                        application.getFinalStatus(),
                        progress.stage(),
                        progress.nextAction(),
                        progress.lastChangedAt(),
                        application.getDraftSavedAt(),
                        application.getSubmittedAt(),
                        application.getReviewedAt(),
                        application.getFinalDecidedAt(),
                        application.getWithdrawnAt(),
                        application.getWithdrawalReason()
                    );
                })
                .toList();
    }

    private CandidateProgress resolveProgress(Application application, List<Interview> interviews) {
        OffsetDateTime lastChangedAt = interviews.stream()
                .map(Interview::getUpdatedAt)
                .filter(java.util.Objects::nonNull)
                .max(Comparator.naturalOrder())
                .filter(interviewChangedAt -> interviewChangedAt.isAfter(application.getUpdatedAt()))
                .orElse(application.getUpdatedAt());

        if (application.getStatus() == ApplicationStatus.DRAFT) {
            return new CandidateProgress(CandidateVisibleStage.DRAFT, CandidateNextAction.COMPLETE_APPLICATION, lastChangedAt);
        }
        if (application.getFinalStatus() == ApplicationFinalStatus.OFFER_MADE) {
            return new CandidateProgress(CandidateVisibleStage.OFFER, CandidateNextAction.REVIEW_OFFER, lastChangedAt);
        }
        if (application.getFinalStatus() != null || application.getReviewStatus() == ApplicationReviewStatus.REJECTED) {
            return new CandidateProgress(CandidateVisibleStage.CLOSED, CandidateNextAction.NONE, lastChangedAt);
        }

        Interview latestInterview = interviews.stream()
                .filter(interview -> interview.getStatus() != InterviewStatus.CANCELLED)
                .max(Comparator.comparing(Interview::getUpdatedAt))
                .orElse(null);
        if (latestInterview != null) {
            CandidateNextAction nextAction = switch (latestInterview.getStatus()) {
                case SCHEDULED -> CandidateNextAction.PREPARE_FOR_INTERVIEW;
                case COMPLETED -> CandidateNextAction.WAIT_FOR_DECISION;
                case NO_SHOW -> CandidateNextAction.CONTACT_RECRUITING;
                case CANCELLED -> CandidateNextAction.WAIT_FOR_INTERVIEW;
            };
            return new CandidateProgress(CandidateVisibleStage.INTERVIEW, nextAction, lastChangedAt);
        }
        if (application.getReviewStatus() == ApplicationReviewStatus.PASSED) {
            return new CandidateProgress(CandidateVisibleStage.INTERVIEW, CandidateNextAction.WAIT_FOR_INTERVIEW, lastChangedAt);
        }
        return new CandidateProgress(CandidateVisibleStage.SCREENING, CandidateNextAction.WAIT_FOR_REVIEW, lastChangedAt);
    }

    private record CandidateProgress(
            CandidateVisibleStage stage,
            CandidateNextAction nextAction,
            OffsetDateTime lastChangedAt
    ) {
    }
}
