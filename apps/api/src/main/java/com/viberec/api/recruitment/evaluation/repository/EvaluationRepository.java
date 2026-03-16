package com.viberec.api.recruitment.evaluation.repository;

import com.viberec.api.recruitment.evaluation.domain.Evaluation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {

    List<Evaluation> findByInterviewIdOrderByCreatedAt(Long interviewId);

    Optional<Evaluation> findByInterviewIdAndEvaluatorId(Long interviewId, Long evaluatorId);

    List<Evaluation> findByInterviewApplicationIdOrderByCreatedAt(Long applicationId);
}
