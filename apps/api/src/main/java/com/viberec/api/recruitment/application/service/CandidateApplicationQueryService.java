package com.viberec.api.recruitment.application.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationResumeRaw;
import com.viberec.api.recruitment.application.repository.ApplicationAnswerRepository;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.web.ApplicationAnswerDto;
import com.viberec.api.recruitment.application.web.CandidateApplicationDetailResponse;
import com.viberec.api.recruitment.application.web.CandidateApplicationSummaryResponse;
import java.util.List;
import java.util.Map;
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

    public CandidateApplicationQueryService(
            ApplicationRepository applicationRepository,
            ApplicationResumeRawRepository applicationResumeRawRepository,
            ResumeNormalizationService resumeNormalizationService,
            ApplicationAnswerRepository applicationAnswerRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.applicationResumeRawRepository = applicationResumeRawRepository;
        this.resumeNormalizationService = resumeNormalizationService;
        this.applicationAnswerRepository = applicationAnswerRepository;
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
                application.getDraftSavedAt(),
                application.getSubmittedAt(),
                application.getReviewedAt(),
                application.getFinalDecidedAt(),
                resumePayload,
                resumeNormalizationService.getEducations(application.getId()),
                resumeNormalizationService.getExperiences(application.getId()),
                resumeNormalizationService.getSkills(application.getId()),
                resumeNormalizationService.getCertifications(application.getId()),
                resumeNormalizationService.getLanguages(application.getId()),
                application.getCurrentStep(),
                application.getMotivationFit(),
                answers
        );
    }

    public List<CandidateApplicationSummaryResponse> getCandidateApplications(CandidateAccount candidateAccount) {
        return applicationRepository.findAllWithJobPostingByCandidateAccountId(candidateAccount.getId()).stream()
                .map(application -> new CandidateApplicationSummaryResponse(
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
                        application.getDraftSavedAt(),
                        application.getSubmittedAt(),
                        application.getReviewedAt(),
                        application.getFinalDecidedAt()
                ))
                .toList();
    }
}
