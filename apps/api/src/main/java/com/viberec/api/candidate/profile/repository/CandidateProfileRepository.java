package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {
    Optional<CandidateProfile> findByCandidateAccountId(Long candidateAccountId);
}
