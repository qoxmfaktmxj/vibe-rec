package com.viberec.api.recruitment.notification.repository;

import com.viberec.api.recruitment.notification.domain.NotificationTemplate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    Optional<NotificationTemplate> findByTemplateKey(String templateKey);
}
