package com.viberec.api.recruitment.interview.repository;

import com.viberec.api.recruitment.interview.domain.InterviewEvaluator;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewEvaluatorRepository extends JpaRepository<InterviewEvaluator, Long> {

    List<InterviewEvaluator> findByInterviewIdOrderByCreatedAtAsc(Long interviewId);

    void deleteByInterviewId(Long interviewId);
}
