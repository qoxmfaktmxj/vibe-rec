package com.viberec.api.recruitment.notification.repository;

import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.domain.NotificationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    boolean existsByApplicationIdAndStatus(Long applicationId, NotificationStatus status);
}
