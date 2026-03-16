package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationSkill;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationSkillRepository extends JpaRepository<ApplicationSkill, Long> {

    List<ApplicationSkill> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
