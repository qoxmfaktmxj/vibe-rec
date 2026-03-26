package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfileSkill;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileSkillRepository extends JpaRepository<CandidateProfileSkill, Long> {
    List<CandidateProfileSkill> findByCandidateAccountIdOrderBySortOrder(Long candidateAccountId);
    void deleteByCandidateAccountId(Long candidateAccountId);
}
