package com.viberec.api.admin.hiring.service;

import com.viberec.api.admin.auth.domain.AdminAccount;
import com.viberec.api.admin.auth.repository.AdminAccountRepository;
import com.viberec.api.admin.hiring.web.CreateNotificationRequest;
import com.viberec.api.admin.hiring.web.FinalDecisionRequest;
import com.viberec.api.admin.hiring.web.FinalDecisionResponse;
import com.viberec.api.admin.hiring.web.NotificationResponse;
import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationFinalStatus;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.repository.ApplicationRepository;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminHiringDecisionService {

    private final ApplicationRepository applicationRepository;
    private final NotificationLogRepository notificationLogRepository;
    private final AdminAccountRepository adminAccountRepository;

    public AdminHiringDecisionService(
            ApplicationRepository applicationRepository,
            NotificationLogRepository notificationLogRepository,
            AdminAccountRepository adminAccountRepository
    ) {
        this.applicationRepository = applicationRepository;
        this.notificationLogRepository = notificationLogRepository;
        this.adminAccountRepository = adminAccountRepository;
    }

    @Transactional
    public FinalDecisionResponse makeFinalDecision(Long applicationId, FinalDecisionRequest request) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        validateFinalStatusTransition(application, request.finalStatus());

        application.updateFinalStatus(request.finalStatus(), request.note());

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

        NotificationLog log = new NotificationLog(application, request.type(), request.title(), request.content(), sentBy);
        notificationLogRepository.save(log);

        return toNotificationResponse(log, sentByName);
    }

    public List<NotificationResponse> getNotifications(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found."));

        return notificationLogRepository.findByApplicationIdOrderByCreatedAtDesc(applicationId).stream()
                .map(log -> {
                    String sentByName = log.getSentBy() != null
                            ? adminAccountRepository.findById(log.getSentBy())
                                    .map(AdminAccount::getDisplayName)
                                    .orElse("Unknown")
                            : null;
                    return toNotificationResponse(log, sentByName);
                })
                .toList();
    }

    private void validateFinalStatusTransition(Application application, ApplicationFinalStatus targetStatus) {
        ApplicationFinalStatus currentFinalStatus = application.getFinalStatus();

        if (targetStatus == ApplicationFinalStatus.OFFER_MADE) {
            if (application.getReviewStatus() != ApplicationReviewStatus.PASSED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Only applications with PASSED review status can receive an offer.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.ACCEPTED || targetStatus == ApplicationFinalStatus.DECLINED) {
            if (currentFinalStatus != ApplicationFinalStatus.OFFER_MADE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Application must have an offer before it can be accepted or declined.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.WITHDRAWN) {
            if (currentFinalStatus == ApplicationFinalStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "An accepted application cannot be withdrawn.");
            }
        }
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
                log.getCreatedAt()
        );
    }
}
