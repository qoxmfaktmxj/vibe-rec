package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfileExperience;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileExperienceRepository extends JpaRepository<CandidateProfileExperience, Long> {
    List<CandidateProfileExperience> findByCandidateAccountIdOrderBySortOrder(Long candidateAccountId);
    void deleteByCandidateAccountId(Long candidateAccountId);
}
