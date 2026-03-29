package com.viberec.api.candidate.profile.repository;

import com.viberec.api.candidate.profile.domain.CandidateProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {
    Optional<CandidateProfile> findByCandidateAccountId(Long candidateAccountId);

    @Modifying
    @Query(
            value = """
                    insert into platform.candidate_profile (
                        candidate_account_id,
                        introduction_template,
                        core_strength_template,
                        career_years,
                        updated_at
                    ) values (
                        :candidateAccountId,
                        null,
                        null,
                        null,
                        current_timestamp
                    )
                    on conflict (candidate_account_id) do nothing
                    """,
            nativeQuery = true
    )
    void createProfileIfMissing(@Param("candidateAccountId") Long candidateAccountId);
}
