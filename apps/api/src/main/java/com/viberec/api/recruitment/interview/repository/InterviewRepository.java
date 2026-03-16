package com.viberec.api.recruitment.interview.repository;

import com.viberec.api.recruitment.interview.domain.Interview;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewRepository extends JpaRepository<Interview, Long> {

    List<Interview> findByApplicationIdOrderByScheduledAtDesc(Long applicationId);
}
