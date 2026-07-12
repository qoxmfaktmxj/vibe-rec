package com.viberec.api.recruitment.evaluation.repository;

import com.viberec.api.recruitment.evaluation.domain.EvaluationCriterionScore;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EvaluationCriterionScoreRepository extends JpaRepository<EvaluationCriterionScore, Long> {

    @Query("""
            select criterionScore
            from EvaluationCriterionScore criterionScore
            join fetch criterionScore.criterion criterion
            where criterionScore.evaluation.id in :evaluationIds
            order by criterion.sortOrder asc, criterion.id asc
            """)
    List<EvaluationCriterionScore> findByEvaluationIds(@Param("evaluationIds") Collection<Long> evaluationIds);
}
