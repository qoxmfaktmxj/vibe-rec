package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfileEducation;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileEducationRepository extends JpaRepository<CandidateProfileEducation, Long> {
    List<CandidateProfileEducation> findByCandidateAccountIdOrderBySortOrder(Long candidateAccountId);
    void deleteByCandidateAccountId(Long candidateAccountId);
}
