package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationEventRepository extends JpaRepository<ApplicationEvent, Long> {
    List<ApplicationEvent> findByApplicationIdOrderByCreatedAtDescIdDesc(Long applicationId);
    long countByApplicationIdAndEventType(Long applicationId, String eventType);
}
