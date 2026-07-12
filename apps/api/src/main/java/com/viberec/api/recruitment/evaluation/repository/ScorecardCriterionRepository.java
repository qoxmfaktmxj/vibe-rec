package com.viberec.api.recruitment.evaluation.repository;

import com.viberec.api.recruitment.evaluation.domain.ScorecardCriterion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ScorecardCriterionRepository extends JpaRepository<ScorecardCriterion, Long> {

    List<ScorecardCriterion> findByJobPostingStepIdOrderBySortOrderAscIdAsc(Long jobPostingStepId);

    @Modifying
    @Query("delete from ScorecardCriterion criterion where criterion.jobPostingStep.id = :stepId")
    void deleteByStepId(@Param("stepId") Long stepId);
}
