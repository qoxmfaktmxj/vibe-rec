package com.viberec.api.candidate.privacy.repository;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequestEvent;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateDataRequestEventRepository extends JpaRepository<CandidateDataRequestEvent, Long> {
    List<CandidateDataRequestEvent> findByRequestIdOrderByCreatedAtAscIdAsc(Long requestId);
}
