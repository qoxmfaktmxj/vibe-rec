package com.viberec.api.recruitment.notification.service;

import com.viberec.api.recruitment.notification.domain.NotificationLog;

public interface NotificationSender {
    void send(NotificationLog log);
}
