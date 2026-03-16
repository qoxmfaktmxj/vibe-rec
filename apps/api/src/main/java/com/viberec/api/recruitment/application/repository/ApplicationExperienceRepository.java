package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationExperience;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationExperienceRepository extends JpaRepository<ApplicationExperience, Long> {

    List<ApplicationExperience> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
