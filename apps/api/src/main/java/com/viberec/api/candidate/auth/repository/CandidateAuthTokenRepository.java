package com.viberec.api.candidate.auth.repository;

import com.viberec.api.candidate.auth.domain.CandidateAuthToken;
import com.viberec.api.candidate.auth.domain.CandidateAuthTokenPurpose;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateAuthTokenRepository extends JpaRepository<CandidateAuthToken, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select token
            from CandidateAuthToken token
            where token.tokenHash = :tokenHash
              and token.purpose = :purpose
              and token.usedAt is null
              and token.expiresAt > :now
            """)
    Optional<CandidateAuthToken> findActive(
            @Param("tokenHash") String tokenHash,
            @Param("purpose") CandidateAuthTokenPurpose purpose,
            @Param("now") OffsetDateTime now
    );

    @Modifying
    @Query("""
            update CandidateAuthToken token
            set token.usedAt = :usedAt
            where token.candidateAccount.id = :accountId
              and token.purpose = :purpose
              and token.usedAt is null
            """)
    void invalidateActive(
            @Param("accountId") Long accountId,
            @Param("purpose") CandidateAuthTokenPurpose purpose,
            @Param("usedAt") OffsetDateTime usedAt
    );
}
