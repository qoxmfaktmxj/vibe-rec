package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfileCertification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileCertificationRepository extends JpaRepository<CandidateProfileCertification, Long> {
    List<CandidateProfileCertification> findByCandidateAccountIdOrderBySortOrder(Long candidateAccountId);
    void deleteByCandidateAccountId(Long candidateAccountId);
}
