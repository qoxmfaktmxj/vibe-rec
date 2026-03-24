package com.viberec.api.recruitment.jobposting.repository;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingStepRepository extends JpaRepository<JobPostingStep, Long> {

    List<JobPostingStep> findByJobPostingIdOrderByStepOrderAsc(Long jobPostingId);

    Optional<JobPostingStep> findByJobPostingIdAndStepOrder(Long jobPostingId, short stepOrder);
}
