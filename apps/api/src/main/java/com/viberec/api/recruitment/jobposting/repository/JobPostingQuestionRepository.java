package com.viberec.api.recruitment.jobposting.repository;

import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface JobPostingQuestionRepository extends JpaRepository<JobPostingQuestion, Long> {
    List<JobPostingQuestion> findByJobPostingIdOrderBySortOrder(Long jobPostingId);
    void deleteByJobPostingId(Long jobPostingId);
}
