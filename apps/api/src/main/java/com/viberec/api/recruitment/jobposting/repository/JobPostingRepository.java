package com.viberec.api.recruitment.jobposting.repository;

import com.viberec.api.recruitment.jobposting.domain.JobPosting;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    @EntityGraph(attributePaths = "steps")
    List<JobPosting> findByPublishedTrueOrderByOpensAtDesc();

    @EntityGraph(attributePaths = "steps")
    Optional<JobPosting> findWithStepsById(Long id);
}

