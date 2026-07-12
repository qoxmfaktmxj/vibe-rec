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
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import com.viberec.api.recruitment.notification.service.CandidateNotificationService;
import com.viberec.api.recruitment.notification.service.NotificationOutboxDispatcher;
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
    @Autowired private ApplicationEventService applicationEventService;
    @Autowired private ApplicationRepository applicationRepository;
    @Autowired private ApplicationResumeRawRepository applicationResumeRawRepository;
    @Autowired private NotificationLogRepository notificationLogRepository;
    @Autowired private NotificationOutboxDispatcher notificationOutboxDispatcher;
    @Autowired private CandidateNotificationService candidateNotificationService;
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
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have shipped candidate decision flows with clear acceptance and decline rules.",
                "coreStrength", "I can keep final-status transitions predictable while features evolve."
        ))).applicationId();

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
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have managed candidate communications and status notifications.",
                "coreStrength", "I keep recruiter messaging consistent across workflow transitions."
        ))).applicationId();
        Long senderId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();
        var template = adminHiringDecisionService.getNotificationTemplates(applicationId).stream()
                .filter(candidateTemplate -> "GENERAL".equals(candidateTemplate.type()))
                .findFirst()
                .orElseThrow();
        assertThat(template.title()).doesNotContain("{jobPostingTitle}");
        assertThat(template.content())
                .contains("Notify Kim")
                .doesNotContain("{candidateName}", "{jobPostingTitle}");

        adminHiringDecisionService.createNotification(applicationId, senderId, new CreateNotificationRequest("GENERAL", "First", "First notification"));
        var created = adminHiringDecisionService.createNotification(
                applicationId,
                senderId,
                new CreateNotificationRequest(
                        template.id(),
                        template.type(),
                        template.title(),
                        template.content()
                )
        );

        assertThat(created.deliveryStatus()).isEqualTo(NotificationDeliveryStatus.PENDING);
        assertThat(created.templateId()).isEqualTo(template.id());
        assertThat(notificationOutboxDispatcher.dispatchPending()).isEqualTo(2);

        var notifications = adminHiringDecisionService.getNotifications(applicationId);
        var candidateNotifications = candidateNotificationService.getNotifications(candidate);

        assertThat(created.sentByName()).isEqualTo("Dev Admin");
        assertThat(notifications).hasSize(2);
        assertThat(notifications.getFirst().title()).isEqualTo(template.title());
        assertThat(notifications.getFirst().sentByName()).isEqualTo("Dev Admin");
        assertThat(notifications)
                .allSatisfy(notification -> {
                    assertThat(notification.deliveryStatus()).isEqualTo(NotificationDeliveryStatus.DELIVERED);
                    assertThat(notification.deliveryAttempts()).isEqualTo(1);
                    assertThat(notification.deliveredAt()).isNotNull();
                });
        assertThat(candidateNotifications)
                .extracting("title")
                .containsExactly(template.title(), "First");

        candidateNotificationService.markRead(candidateNotifications.getFirst().id(), candidate);
        assertThat(adminHiringDecisionService.getNotifications(applicationId).getFirst().readAt()).isNotNull();
    }

    @Test
    void retriesOnlyFailedNotificationsOwnedByTheApplicationAndKeepsAttemptHistory() {
        CandidateAccount firstCandidate = registerCandidate(
                "Retry Kim",
                "retry.kim@example.com",
                "010-7070-8181"
        );
        CandidateAccount secondCandidate = registerCandidate(
                "Other Kim",
                "other.kim@example.com",
                "010-7070-8282"
        );
        Long firstApplicationId = applicationDraftService.submit(1001L, firstCandidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I build observable delivery workflows with explicit recovery paths.",
                "coreStrength", "I preserve attempt history while making failed work safely retryable."
        ))).applicationId();
        Long secondApplicationId = applicationDraftService.submit(1001L, secondCandidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I verify object ownership at every administrative boundary.",
                "coreStrength", "I prevent cross-application mutation in operational tools."
        ))).applicationId();
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();
        var created = adminHiringDecisionService.createNotification(
                firstApplicationId,
                adminId,
                new CreateNotificationRequest("GENERAL", "Retry delivery", "This message will be retried.")
        );
        var notification = notificationLogRepository.findById(created.id()).orElseThrow();
        notification.markDeliveryFailed("Simulated provider outage");
        notificationLogRepository.saveAndFlush(notification);

        assertThatThrownBy(() -> adminHiringDecisionService.retryNotification(
                secondApplicationId,
                created.id(),
                adminId
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.NOT_FOUND);

        var retried = adminHiringDecisionService.retryNotification(firstApplicationId, created.id(), adminId);

        assertThat(retried.deliveryStatus()).isEqualTo(NotificationDeliveryStatus.PENDING);
        assertThat(retried.deliveryAttempts()).isEqualTo(1);
        assertThat(retried.manualRetryCount()).isEqualTo(1);
        assertThat(retried.nextAttemptAt()).isNotNull();
        assertThat(notificationOutboxDispatcher.dispatchPending()).isEqualTo(1);

        var delivered = adminHiringDecisionService.getNotifications(firstApplicationId).getFirst();
        assertThat(delivered.deliveryStatus()).isEqualTo(NotificationDeliveryStatus.DELIVERED);
        assertThat(delivered.deliveryAttempts()).isEqualTo(2);
        assertThat(delivered.manualRetryCount()).isEqualTo(1);
        assertThatThrownBy(() -> adminHiringDecisionService.retryNotification(
                firstApplicationId,
                created.id(),
                adminId
        ))
                .isInstanceOf(ResponseStatusException.class)
                .extracting(error -> ((ResponseStatusException) error).getStatusCode())
                .isEqualTo(HttpStatus.CONFLICT);
        assertThat(applicationEventService.getEvents(firstApplicationId))
                .anySatisfy(event -> {
                    assertThat(event.eventType()).isEqualTo("NOTIFICATION_RETRY_REQUESTED");
                    assertThat(event.actorId()).isEqualTo(adminId);
                    assertThat(event.fromState()).isEqualTo("FAILED");
                    assertThat(event.toState()).isEqualTo("PENDING");
                });
    }

    @Test
    void recordsAdminActorsForReviewDecisionAndNotificationEvents() {
        CandidateAccount candidate = registerCandidate("Audit Kim", "audit.kim@example.com", "010-8080-9090");
        Long applicationId = applicationDraftService.submit(1001L, candidate, validSubmitRequest(1001L, Map.of(
                "introduction", "I have implemented auditable hiring workflows with explicit business transitions.",
                "coreStrength", "I preserve actor identity and state changes for operational review."
        ))).applicationId();
        Long adminId = adminAccountRepository.findByUsernameIgnoreCase("admin").orElseThrow().getId();

        adminApplicantService.updateReviewStatus(
                applicationId,
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.IN_REVIEW, "Audit review started."),
                "ADMIN",
                adminId
        );
        adminApplicantService.updateReviewStatus(
                applicationId,
                new UpdateApplicantReviewStatusRequest(ApplicationReviewStatus.PASSED, "Audit review passed."),
                "ADMIN",
                adminId
        );
        adminHiringDecisionService.makeFinalDecision(
                applicationId,
                new FinalDecisionRequest(ApplicationFinalStatus.OFFER_MADE, "Audited offer."),
                "ADMIN",
                adminId
        );
        adminHiringDecisionService.createNotification(
                applicationId,
                adminId,
                new CreateNotificationRequest("GENERAL", "Offer update", "Your offer is ready.")
        );

        var events = applicationEventService.getEvents(applicationId);

        assertThat(events)
                .filteredOn(event -> "REVIEW_STATUS_CHANGED".equals(event.eventType()))
                .hasSize(2)
                .allSatisfy(event -> {
                    assertThat(event.actorType()).isEqualTo("ADMIN");
                    assertThat(event.actorId()).isEqualTo(adminId);
                });
        assertThat(events)
                .anySatisfy(event -> {
                    assertThat(event.eventType()).isEqualTo("FINAL_STATUS_CHANGED");
                    assertThat(event.fromState()).isNull();
                    assertThat(event.toState()).isEqualTo("OFFER_MADE");
                    assertThat(event.actorId()).isEqualTo(adminId);
                })
                .anySatisfy(event -> {
                    assertThat(event.eventType()).isEqualTo("NOTIFICATION_CREATED");
                    assertThat(event.toState()).isEqualTo("GENERAL");
                    assertThat(event.actorId()).isEqualTo(adminId);
                });
    }

    private CandidateAccount registerCandidate(String displayName, String email, String phoneNumber) {
        var login = candidateAuthService.signup(new CandidateSignupRequest(displayName, email, phoneNumber, "password123"));
        verifyCandidateEmail(email);
        return candidateAuthService.requireActiveAccount(login.sessionToken());
    }
}
