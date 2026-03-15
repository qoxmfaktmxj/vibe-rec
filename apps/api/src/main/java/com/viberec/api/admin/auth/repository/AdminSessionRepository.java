package com.viberec.api.admin.auth.repository;

import com.viberec.api.admin.auth.domain.AdminSession;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminSessionRepository extends JpaRepository<AdminSession, Long> {

    @Query("""
            select adminSession
            from AdminSession adminSession
            join fetch adminSession.adminAccount adminAccount
            where adminSession.tokenHash = :tokenHash
              and adminSession.invalidatedAt is null
              and adminSession.expiresAt > :now
              and adminAccount.active = true
            """)
    Optional<AdminSession> findActiveSessionByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("""
            update AdminSession adminSession
            set adminSession.lastSeenAt = :now,
                adminSession.updatedAt = :now
            where adminSession.id = :id
            """)
    void touch(@Param("id") Long id, @Param("now") OffsetDateTime now);

    @Modifying
    @Query("""
            update AdminSession adminSession
            set adminSession.invalidatedAt = :now,
                adminSession.updatedAt = :now
            where adminSession.tokenHash = :tokenHash
              and adminSession.invalidatedAt is null
            """)
    void invalidateByTokenHash(@Param("tokenHash") String tokenHash, @Param("now") OffsetDateTime now);
}
