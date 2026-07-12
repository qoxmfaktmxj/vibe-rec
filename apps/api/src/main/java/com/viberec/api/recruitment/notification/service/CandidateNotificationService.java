package com.viberec.api.recruitment.notification.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.recruitment.notification.web.CandidateNotificationResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateNotificationService {

    private final NotificationLogRepository notificationLogRepository;

    public CandidateNotificationService(NotificationLogRepository notificationLogRepository) {
        this.notificationLogRepository = notificationLogRepository;
    }

    public List<CandidateNotificationResponse> getNotifications(CandidateAccount candidateAccount) {
        return notificationLogRepository
                .findByApplicationCandidateAccountIdAndDeliveryStatusOrderByDeliveredAtDescIdDesc(
                        candidateAccount.getId(),
                        NotificationDeliveryStatus.DELIVERED
                )
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CandidateNotificationResponse markRead(Long notificationId, CandidateAccount candidateAccount) {
        NotificationLog notification = notificationLogRepository
                .findByIdAndApplicationCandidateAccountId(notificationId, candidateAccount.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found."));
        if (notification.getDeliveryStatus() != NotificationDeliveryStatus.DELIVERED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Notification has not been delivered.");
        }
        notification.markRead();
        return toResponse(notification);
    }

    private CandidateNotificationResponse toResponse(NotificationLog notification) {
        return new CandidateNotificationResponse(
                notification.getId(),
                notification.getApplication().getId(),
                notification.getApplication().getJobPosting().getTitle(),
                notification.getType(),
                notification.getTitle(),
                notification.getContent(),
                notification.getDeliveredAt(),
                notification.getReadAt()
        );
    }
}
