package com.viberec.api.recruitment.notification.service;

import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationOutboxDispatcher {

    private final NotificationLogRepository notificationLogRepository;
    private final NotificationDeliveryGateway deliveryGateway;
    private final ApplicationEventService applicationEventService;

    public NotificationOutboxDispatcher(
            NotificationLogRepository notificationLogRepository,
            NotificationDeliveryGateway deliveryGateway,
            ApplicationEventService applicationEventService
    ) {
        this.notificationLogRepository = notificationLogRepository;
        this.deliveryGateway = deliveryGateway;
        this.applicationEventService = applicationEventService;
    }

    @Scheduled(
            fixedDelayString = "${app.notification.dispatch-interval-ms:5000}",
            initialDelayString = "${app.notification.dispatch-initial-delay-ms:5000}"
    )
    @Transactional
    public int dispatchPending() {
        List<NotificationLog> notifications = notificationLogRepository.findDispatchable(
                List.of(NotificationDeliveryStatus.PENDING, NotificationDeliveryStatus.FAILED),
                OffsetDateTime.now(),
                PageRequest.of(0, 50)
        );

        int deliveredCount = 0;
        for (NotificationLog notification : notifications) {
            try {
                deliveryGateway.deliver(notification);
                notification.markDelivered();
                applicationEventService.record(
                        notification.getApplication(),
                        "NOTIFICATION_DELIVERED",
                        null,
                        notification.getChannel().name(),
                        "SYSTEM",
                        null,
                        null,
                        "{\"notificationId\":" + notification.getId() + "}"
                );
                deliveredCount++;
            } catch (RuntimeException exception) {
                String message = exception.getMessage();
                notification.markDeliveryFailed(
                        exception.getClass().getSimpleName() + (message == null ? "" : ": " + message)
                );
                applicationEventService.record(
                        notification.getApplication(),
                        "NOTIFICATION_DELIVERY_FAILED",
                        null,
                        notification.getDeliveryStatus().name(),
                        "SYSTEM",
                        null,
                        "Delivery attempt failed.",
                        "{\"notificationId\":" + notification.getId()
                                + ",\"deliveryAttempts\":" + notification.getDeliveryAttempts()
                                + ",\"terminal\":" + (notification.getNextAttemptAt() == null) + "}"
                );
            }
        }
        return deliveredCount;
    }
}
