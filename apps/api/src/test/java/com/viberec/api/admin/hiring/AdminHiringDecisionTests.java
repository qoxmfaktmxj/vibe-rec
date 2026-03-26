package com.viberec.api.admin.hiring;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.viberec.api.admin.applicant.service.AdminApplicantService;
import com.viberec.api.admin.applicant.web.UpdateApplicantReviewStatusRequest;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.hiring.service.AdminHiringDecisionService;
import com.viberec.api.admin.hiring.web.CreateNotificationRequest;
import com.viberec.api.admin.hiring.web.FinalDecisionRequest;
import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.auth.repository.CandidateAccountRepository;
import com.viberec.api.candidate.auth.repository.CandidateSessionRepository;
import com.viberec.api.candidate.auth.service.CandidateAuthService;
import com.viberec.api.candidate.auth.web.CandidateSignupRequest;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.repository.ApplicationResumeRawRepository;
import com.viberec.api.recruitment.application.service.ApplicationDraftService;
import com.viberec.api.recruitment.application.web.SaveApplicationDraftRequest;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.support.IntegrationTestBase;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class AdminHiringDecisionTests extends IntegrationTestBase {

    @Autowired private AdminApplicantService adminApplicantService;
    @Autowired private AdminHiringDecisionService adminHiringDecisionService;
    @Autowired private ApplicationDraftService applicationDraftService;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationResumeRawRepository applicationResumeRawRepository;
    @Autowired private NotificationLogRepository notificationLogRepository;
    @Autowired private AdminAccountRepository adminAccountRepository;
    @Autowired private CandidateAuthService candidateAuthService;
    @Autowired private CandidateSessionRepository candidateSessionRepository;
    @Autowired private CandidateAccountRepository candidateAccountRepository;

    @BeforeEach
    void cleanApplications() {
        notificationLogRepository.deleteAll();
        applicationResumeRawRepository.deleteAll();
        applicationRepository.deleteAll();
        candidateSessionRepository.deleteAll();
        candidateAccountRepository.deleteAll();
    }

    @Test
    void enforcesFinalDecisionTransitionRules() {
        CandidateAccount candidate = registerCandidate("Hiring Kim", "hiring.kim@example.com", "010-5050-6060");
        Long applicationId = applicationDraftService.submit(1001L, candidate, new SaveApplicationDraftRequest(Map.of(
                "introduction", "I have shipped candidate decision flows with clear acceptance and decline rules.",
                "coreStrength", "I can keep final-status transitions predictable while features evolve."
        ), null, null, null, null, null)).applicationId();

        assertThatThrownBy(() -> adminHiringDecisionService.makeFinalDecision(
                applicationId,
                new FinalDecisionRequest(ApplicationFinalStatus.OFFER_MADE, "Too early")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);

        adminApplicantService.updateReviewStatus(applicationId, new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.IN_REVIEW, "Review started."));
        adminApplicantService.updateReviewStatus(applicationId, new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.PASSED, "Strong candidate."));

        var offer = adminHiringDecisionService.makeFinalDecision(applicationId, new FinalDecisionRequest(ApplicationFinalStatus.OFFER_MADE, "Offer extended"));
        var accepted = adminHiringDecisionService.makeFinalDecision(applicationId, new FinalDecisionRequest(ApplicationFinalStatus.ACCEPTED, "Offer accepted"));
        var applicant = adminApplicantService.getApplicant(applicationId);

        assertThat(offer.finalStatus()).isEqualTo(ApplicationFinalStatus.OFFER_MADE);
        assertThat(accepted.finalStatus()).isEqualTo(ApplicationFinalStatus.ACCEPTED);
        assertThat(applicant.finalStatus()).isEqualTo(ApplicationFinalStatus.ACCEPTED);
        assertThat(applicant.finalNote()).isEqualTo("Offer accepted");
        assertThat(applicant.finalDecidedAt()).isNotNull();

        assertThatThrownBy(() -> adminHiringDecisionService.makeFinalDecision(
                applicationId,
                new FinalDecisionRequest(ApplicationFinalStatus.WITHDRAWN, "Should not withdraw accepted")
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void createsAndListsNotificationsWithSenderName() {
        CandidateAccount candidate = registerCandidate("Notify Kim", "notify.kim@example.com", "010-7070-8080");
        Long applicationId = applicationDraftService.submit(1001L, candidate, new SaveApplicationDraftRequest(Map.of(
                "introduction", "I have managed candidate communications and status notifications.",
                "coreStrength", "I keep recruiter messaging consistent across workflow transitions."
        ), null, null, null, null, null)).applicationId();
        Long senderId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        adminHiringDecisionService.createNotification(applicationId, senderId, new CreateNotificationRequest("GENERAL", "First", "First notification"));
        var created = adminHiringDecisionService.createNotification(applicationId, senderId, new CreateNotificationRequest("GENERAL", "Second", "Second notification"));

        var notifications = adminHiringDecisionService.getNotifications(applicationId);

        assertThat(created.sentByName()).isEqualTo("Dev Admin");
        assertThat(notifications).hasSize(2);
        assertThat(notifications.getFirst().title()).isEqualTo("Second");
        assertThat(notifications.getFirst().sentByName()).isEqualTo("Dev Admin");
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
