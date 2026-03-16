package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationCertification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationCertificationRepository extends JpaRepository<ApplicationCertification, Long> {

    List<ApplicationCertification> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
