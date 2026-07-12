package com.viberec.api.recruitment.notification.service;

import com.viberec.api.recruitment.notification.domain.NotificationLog;

public interface NotificationDeliveryGateway {
    void deliver(NotificationLog notification);
}
