package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.ApplicationResumeRaw;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationResumeRawRepository extends JpaRepository<ApplicationResumeRaw, Long> {
}

