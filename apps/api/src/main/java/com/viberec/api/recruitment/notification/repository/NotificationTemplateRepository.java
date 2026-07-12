package com.viberec.api.recruitment.notification.repository;

import com.viberec.api.recruitment.notification.domain.NotificationTemplate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationTemplateRepository extends JpaRepository<NotificationTemplate, Long> {

    List<NotificationTemplate> findByActiveTrueOrderByTypeAscNameAscIdAsc();

    Optional<NotificationTemplate> findByIdAndActiveTrue(Long id);
}
