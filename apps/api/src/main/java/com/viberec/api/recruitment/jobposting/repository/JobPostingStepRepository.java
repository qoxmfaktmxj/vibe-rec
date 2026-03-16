package com.viberec.api.recruitment.jobposting.repository;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingStepRepository extends JpaRepository<JobPostingStep, Long> {
}
