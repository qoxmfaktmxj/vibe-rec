package com.viberec.api.candidate.auth.repository;

import com.viberec.api.candidate.auth.domain.CandidateSession;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateSessionRepository extends JpaRepository<CandidateSession, Long> {

    @Query("""
            select candidateSession
            from CandidateSession candidateSession
            join fetch candidateSession.candidateAccount candidateAccount
            where candidateSession.tokenHash = :tokenHash
              and candidateSession.invalidatedAt is null
              and candidateSession.expiresAt > :now
              and candidateAccount.status = com.viberec.api.candidate.auth.domain.CandidateAccountStatus.ACTIVE
            """)
    Optional<CandidateSession> findActiveSessionByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("""
            update CandidateSession candidateSession
            set candidateSession.lastSeenAt = :now,
                candidateSession.updatedAt = :now
            where candidateSession.id = :id
            """)
    void touch(@Param("id") Long id, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("""
            update CandidateSession candidateSession
            set candidateSession.invalidatedAt = :now,
                candidateSession.updatedAt = :now
            where candidateSession.tokenHash = :tokenHash
              and candidateSession.invalidatedAt is null
            """)
    void invalidateByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") OffsetDateTime now);
}
