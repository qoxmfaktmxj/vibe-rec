package com.viberec.api.recruitment.notification.service;

import com.viberec.api.recruitment.notification.domain.NotificationLog;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * MVP 스텁 구현체: 실제 발송 없이 콘솔 로그만 출력하고 SENT로 마킹합니다.
 */
@Component
public class StubNotificationSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(StubNotificationSender.class);

    @Override
    public void send(NotificationLog notificationLog) {
        log.info("""
                [STUB NOTIFICATION]
                Channel  : {}
                To       : {}
                Subject  : {}
                ---
                {}
                ---""",
                notificationLog.getChannel(),
                notificationLog.getRecipient(),
                notificationLog.getSubject(),
                notificationLog.getBody()
        );
        notificationLog.markSent();
    }
}
