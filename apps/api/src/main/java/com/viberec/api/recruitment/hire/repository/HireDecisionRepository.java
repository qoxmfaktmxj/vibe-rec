package com.viberec.api.recruitment.hire.repository;

import com.viberec.api.recruitment.hire.domain.HireDecision;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HireDecisionRepository extends JpaRepository<HireDecision, Long> {

    Optional<HireDecision> findByApplicationId(Long applicationId);

    boolean existsByApplicationId(Long applicationId);
}
