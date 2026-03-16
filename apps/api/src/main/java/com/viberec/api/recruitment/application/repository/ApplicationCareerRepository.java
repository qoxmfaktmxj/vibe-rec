package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationCareer;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationCareerRepository extends JpaRepository<ApplicationCareer, Long> {

    List<ApplicationCareer> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
