package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfileLanguage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileLanguageRepository extends JpaRepository<CandidateProfileLanguage, Long> {
    List<CandidateProfileLanguage> findByCandidateAccountIdOrderBySortOrder(Long candidateAccountId);
    void deleteByCandidateAccountId(Long candidateAccountId);
}
