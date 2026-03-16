package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationEducation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationEducationRepository extends JpaRepository<ApplicationEducation, Long> {

    List<ApplicationEducation> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
