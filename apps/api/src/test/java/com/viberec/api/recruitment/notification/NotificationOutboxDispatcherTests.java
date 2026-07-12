package com.viberec.api.recruitment.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.service.ApplicationEventService;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.repository.NotificationLogRepository;
import com.viberec.api.recruitment.notification.service.NotificationDeliveryGateway;
import com.viberec.api.recruitment.notification.service.NotificationOutboxDispatcher;
import java.util.List;
import org.junit.jupiter.api.Test;

class NotificationOutboxDispatcherTests {

    private final NotificationLogRepository repository = mock(NotificationLogRepository.class);
    private final NotificationDeliveryGateway deliveryGateway = mock(NotificationDeliveryGateway.class);
    private final ApplicationEventService eventService = mock(ApplicationEventService.class);
    private final NotificationOutboxDispatcher dispatcher = new NotificationOutboxDispatcher(
            repository,
            deliveryGateway,
            eventService
    );

    @Test
    void marksSuccessfulDeliveryAndIncrementsAttemptCount() {
        NotificationLog notification = notification();
        when(repository.findDispatchable(any(), any(), any())).thenReturn(List.of(notification));

        int delivered = dispatcher.dispatchPending();

        assertThat(delivered).isEqualTo(1);
        assertThat(notification.getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.DELIVERED);
        assertThat(notification.getDeliveryAttempts()).isEqualTo(1);
        assertThat(notification.getDeliveredAt()).isNotNull();
        assertThat(notification.getNextAttemptAt()).isNull();
    }

    @Test
    void recordsFailureAndSchedulesRetryWithoutLosingOutboxEntry() {
        NotificationLog notification = notification();
        when(repository.findDispatchable(any(), any(), any())).thenReturn(List.of(notification));
        doThrow(new IllegalStateException("temporary delivery failure"))
                .when(deliveryGateway)
                .deliver(notification);

        int delivered = dispatcher.dispatchPending();

        assertThat(delivered).isZero();
        assertThat(notification.getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.FAILED);
        assertThat(notification.getDeliveryAttempts()).isEqualTo(1);
        assertThat(notification.getNextAttemptAt()).isNotNull();
        assertThat(notification.getLastError()).contains("temporary delivery failure");
    }

    @Test
    void terminalFailureCanBeExplicitlyRequeuedWithoutResettingAttemptHistory() {
        NotificationLog notification = notification();
        for (int attempt = 0; attempt < 5; attempt++) {
            notification.markDeliveryFailed("provider unavailable");
        }

        assertThat(notification.getDeliveryAttempts()).isEqualTo(5);
        assertThat(notification.getNextAttemptAt()).isNull();

        notification.scheduleManualRetry();

        assertThat(notification.getDeliveryStatus()).isEqualTo(NotificationDeliveryStatus.PENDING);
        assertThat(notification.getDeliveryAttempts()).isEqualTo(5);
        assertThat(notification.getManualRetryCount()).isEqualTo(1);
        assertThat(notification.getNextAttemptAt()).isNotNull();
    }

    private NotificationLog notification() {
        return new NotificationLog(
                mock(Application.class),
                "GENERAL",
                "Status update",
                "Your application status changed.",
                1L
        );
    }
}
