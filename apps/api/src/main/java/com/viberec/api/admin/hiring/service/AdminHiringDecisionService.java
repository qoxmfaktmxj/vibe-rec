package com.viberec.api.admin.hiring.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.hiring.web.CreateNotificationRequest;
import com.viberec.api.admin.hiring.web.FinalDecisionRequest;
import com.viberec.api.admin.hiring.web.FinalDecisionResponse;
import com.viberec.api.admin.hiring.web.NotificationResponse;
import com.viberec.api.admin.hiring.web.NotificationTemplatePreviewResponse;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import com.viberec.api.recruitment.notification.domain.NotificationTemplate;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.recruitment.notification.repository.NotificationTemplateRepository;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminHiringDecisionService {

    private final ApplicationRepository applicationRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final NotificationTemplateRepository notificationTemplateRepository;
    private final AdminAccountRepository adminAccountRepository;
    private final ApplicationEventService applicationEventService;

    public AdminHiringDecisionService(
            ApplicationRepository applicationRepository,
            NotificationLogRepository notificationLogRepository,
            NotificationTemplateRepository notificationTemplateRepository,
            AdminAccountRepository adminAccountRepository,
            ApplicationEventService applicationEventService
    ) {
        this.applicationRepository = applicationRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.notificationTemplateRepository = notificationTemplateRepository;
        this.adminAccountRepository = adminAccountRepository;
        this.applicationEventService = applicationEventService;
    }

    @Transactional
    public FinalDecisionResponse makeFinalDecision(Long applicationId, FinalDecisionRequest request) {
        return makeFinalDecision(applicationId, request, "SYSTEM", null);
    }

    @Transactional
    public FinalDecisionResponse makeFinalDecision(
            Long applicationId,
            FinalDecisionRequest request,
            String actorType,
            Long actorId
    ) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        validateFinalStatusTransition(application, request.finalStatus());

        ApplicationFinalStatus previousStatus = application.getFinalStatus();
        application.updateFinalStatus(request.finalStatus(), request.note());
        if (previousStatus != request.finalStatus()) {
            applicationEventService.record(
                    application,
                    "FINAL_STATUS_CHANGED",
                    previousStatus == null ? null : previousStatus.name(),
                    request.finalStatus().name(),
                    actorType,
                    actorId,
                    request.note(),
                    null
            );
        }

        return new FinalDecisionResponse(
                application.getId(),
                application.getFinalStatus(),
                application.getFinalDecidedAt(),
                application.getFinalNote()
        );
    }

    @Transactional
    public NotificationResponse createNotification(Long applicationId, Long sentBy, CreateNotificationRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        String sentByName = adminAccountRepository.findById(sentBy)
                .map(AdminAccount::getDisplayName)
                .orElse("Unknown");

        NotificationTemplate template = null;
        if (request.templateId() != null) {
            template = notificationTemplateRepository.findByIdAndActiveTrue(request.templateId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Notification template not found."));
            if (!template.getType().equals(request.type())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Notification type must match the selected template.");
            }
        }

        NotificationLog log = new NotificationLog(
                application,
                request.type(),
                request.title(),
                request.content(),
                sentBy,
                template
        );
        notificationLogRepository.save(log);
        applicationEventService.record(
                application,
                "NOTIFICATION_CREATED",
                null,
                request.type(),
                "ADMIN",
                sentBy,
                request.title(),
                "{\"notificationId\":" + log.getId() + "}"
        );

        return toNotificationResponse(log, sentByName);
    }

    public List<NotificationResponse> getNotifications(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        List<NotificationLog> logs = notificationLogRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId);
        Map<Long, String> sentByNames = loadAdminDisplayNames(logs);

        return logs.stream()
                .map(log -> toNotificationResponse(
                        log,
                        log.getSentBy() != null ? sentByNames.getOrDefault(log.getSentBy(), "Unknown") : null
                ))
                .toList();
    }

    public List<NotificationTemplatePreviewResponse> getNotificationTemplates(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        return notificationTemplateRepository.findByActiveTrueOrderByTypeAscNameAscIdAsc().stream()
                .map(template -> new NotificationTemplatePreviewResponse(
                        template.getId(),
                        template.getCode(),
                        template.getName(),
                        template.getType(),
                        renderTemplate(template.getTitleTemplate(), application),
                        renderTemplate(template.getContentTemplate(), application)
                ))
                .toList();
    }

    @Transactional
    public NotificationResponse retryNotification(Long applicationId, Long notificationId, Long actorId) {
        NotificationLog notification = notificationLogRepository
                .findByIdAndApplicationId(notificationId, applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (notification.getDeliveryStatus() != NotificationDeliveryStatus.FAILED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only failed notifications can be retried.");
        }

        notification.scheduleManualRetry();
        applicationEventService.record(
                notification.getApplication(),
                "NOTIFICATION_RETRY_REQUESTED",
                NotificationDeliveryStatus.FAILED.name(),
                NotificationDeliveryStatus.PENDING.name(),
                "ADMIN",
                actorId,
                null,
                "{\"notificationId\":" + notification.getId()
                        + ",\"deliveryAttempts\":" + notification.getDeliveryAttempts()
                        + ",\"manualRetryCount\":" + notification.getManualRetryCount() + "}"
        );
        String sentByName = notification.getSentBy() == null
                ? null
                : adminAccountRepository.findById(notification.getSentBy())
                        .map(AdminAccount::getDisplayName)
                        .orElse("Unknown");
        return toNotificationResponse(notification, sentByName);
    }

    private void validateFinalStatusTransition(Application application, ApplicationFinalStatus targetStatus) {
        if (application.getStatus() != ApplicationStatus.SUBMITTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only submitted applications can receive final decisions.");
        }
        ApplicationFinalStatus currentFinalStatus = application.getFinalStatus();

        if (targetStatus == ApplicationFinalStatus.OFFER_MADE) {
            if (application.getReviewStatus() != ApplicationReviewStatus.PASSED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only passed applications can move to OFFER_MADE.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.ACCEPTED || targetStatus == ApplicationFinalStatus.DECLINED) {
            if (currentFinalStatus != ApplicationFinalStatus.OFFER_MADE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only OFFER_MADE applications can move to ACCEPTED or DECLINED.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.WITHDRAWN && currentFinalStatus == ApplicationFinalStatus.ACCEPTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Accepted applications cannot be moved to WITHDRAWN.");
        }
    }

    private Map<Long, String> loadAdminDisplayNames(List<NotificationLog> logs) {
        Set<Long> adminIds = logs.stream()
                .map(NotificationLog::getSentBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        if (adminIds.isEmpty()) {
            return Map.of();
        }

        return adminAccountRepository.findAllById(adminIds).stream()
                .collect(Collectors.toMap(AdminAccount::getId, AdminAccount::getDisplayName));
    }

    private NotificationResponse toNotificationResponse(NotificationLog log, String sentByName) {
        return new NotificationResponse(
                log.getId(),
                log.getApplication().getId(),
                log.getType(),
                log.getTitle(),
                log.getContent(),
                log.getSentBy(),
                sentByName,
                log.getChannel(),
                log.getDeliveryStatus(),
                log.getDeliveryAttempts(),
                log.getNextAttemptAt(),
                log.getDeliveredAt(),
                log.getReadAt(),
                log.getLastError(),
                log.getCreatedAt(),
                log.getTemplate() == null ? null : log.getTemplate().getId(),
                log.getManualRetryCount()
        );
    }

    private String renderTemplate(String value, Application application) {
        return value
                .replace("{candidateName}", application.getApplicantName())
                .replace("{jobPostingTitle}", application.getJobPosting().getTitle());
    }
}
