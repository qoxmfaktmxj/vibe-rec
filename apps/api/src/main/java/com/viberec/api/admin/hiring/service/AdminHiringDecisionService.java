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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

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
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

        String sentByName = adminAccountRepository.findById(sentBy)
                .map(AdminAccount::getDisplayName)
                .orElse("Unknown");

        NotificationLog log = new NotificationLog(application, request.type(), request.title(), request.content(), sentBy);
        notificationLogRepository.save(log);

        return toNotificationResponse(log, sentByName);
    }

    public List<NotificationResponse> getNotifications(Long applicationId) {
        applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "지원서를 찾을 수 없습니다."));

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
                throw new ResponseStatusException(HttpStatus.CONFLICT, "검토 결과가 통과인 지원서만 오퍼할 수 있습니다.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.ACCEPTED || targetStatus == ApplicationFinalStatus.DECLINED) {
            if (currentFinalStatus != ApplicationFinalStatus.OFFER_MADE) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "오퍼가 먼저 있어야 수락 또는 거절로 변경할 수 있습니다.");
            }
        }

        if (targetStatus == ApplicationFinalStatus.WITHDRAWN) {
            if (currentFinalStatus == ApplicationFinalStatus.ACCEPTED) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "수락된 지원서는 철회 상태로 변경할 수 없습니다.");
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
