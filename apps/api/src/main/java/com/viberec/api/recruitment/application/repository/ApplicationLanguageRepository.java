package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationLanguage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationLanguageRepository extends JpaRepository<ApplicationLanguage, Long> {

    List<ApplicationLanguage> findByApplicationIdOrderBySortOrder(Long applicationId);

    void deleteByApplicationId(Long applicationId);
}
