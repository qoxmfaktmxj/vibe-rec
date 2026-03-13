package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.Application;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobPostingIdAndApplicantEmailIgnoreCase(Long jobPostingId, String applicantEmail);
}

