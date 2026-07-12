package com.viberec.api.recruitment.notification.service;

import com.viberec.api.recruitment.notification.domain.NotificationChannel;
import com.viberec.api.recruitment.notification.domain.NotificationLog;
import org.springframework.stereotype.Component;

@Component
public class InAppNotificationDeliveryGateway implements NotificationDeliveryGateway {

    @Override
    public void deliver(NotificationLog notification) {
        if (notification.getChannel() != NotificationChannel.IN_APP) {
            throw new IllegalArgumentException("Unsupported notification channel: " + notification.getChannel());
        }
        if (notification.getApplication().getCandidateAccount() == null) {
            throw new IllegalStateException("The application has no candidate recipient.");
        }
    }
}
