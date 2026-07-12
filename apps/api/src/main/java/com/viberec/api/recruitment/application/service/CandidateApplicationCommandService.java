package com.viberec.api.recruitment.application.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.web.WithdrawApplicationRequest;
import com.viberec.api.recruitment.application.web.WithdrawApplicationResponse;
import com.viberec.api.recruitment.interview.domain.InterviewStatus;
import com.viberec.api.recruitment.interview.repository.InterviewRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CandidateApplicationCommandService {

    private final ApplicationRepository applicationRepository;
    private final InterviewRepository interviewRepository;
    private final ApplicationEventService applicationEventService;

    public CandidateApplicationCommandService(
            ApplicationRepository applicationRepository,
            InterviewRepository interviewRepository,
            ApplicationEventService applicationEventService
    ) {
        this.applicationRepository = applicationRepository;
        this.interviewRepository = interviewRepository;
        this.applicationEventService = applicationEventService;
    }

    @Transactional
    public WithdrawApplicationResponse withdraw(
            Long applicationId,
            CandidateAccount candidateAccount,
            WithdrawApplicationRequest request
    ) {
        Application application = applicationRepository
                .findOwnedForCommandById(applicationId, candidateAccount.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        if (application.isWithdrawn()) {
            return toResponse(application);
        }
        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can be withdrawn.");
        }
        if (application.getReviewStatus() == ApplicationReviewStatus.REJECTED
                || application.getFinalStatus() == ApplicationFinalStatus.ACCEPTED
                || application.getFinalStatus() == ApplicationFinalStatus.DECLINED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This application process is already closed.");
        }

        String reason = request.reason().trim();
        interviewRepository.findByApplicationIdOrderByCreatedAt(applicationId).stream()
                .filter(interview -> interview.getStatus() == InterviewStatus.SCHEDULED)
                .forEach(interview -> {
                    interview.cancel("Application withdrawn: " + reason);
                    applicationEventService.record(
                            application,
                            "INTERVIEW_STATUS_CHANGED",
                            InterviewStatus.SCHEDULED.name(),
                            InterviewStatus.CANCELLED.name(),
                            "CANDIDATE",
                            candidateAccount.getId(),
                            reason,
                            "{\"interviewId\":" + interview.getId() + "}"
                    );
                });

        application.withdraw(reason);
        applicationEventService.record(
                application,
                "APPLICATION_WITHDRAWN",
                ApplicationStatus.SUBMITTED.name(),
                ApplicationStatus.WITHDRAWN.name(),
                "CANDIDATE",
                candidateAccount.getId(),
                reason,
                null
        );
        return toResponse(application);
    }

    private WithdrawApplicationResponse toResponse(Application application) {
        return new WithdrawApplicationResponse(
                application.getId(),
                application.getStatus(),
                application.getWithdrawnAt(),
                application.getWithdrawalReason()
        );
    }
}
