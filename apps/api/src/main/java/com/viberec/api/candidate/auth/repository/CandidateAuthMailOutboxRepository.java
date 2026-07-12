package com.viberec.api.candidate.auth.repository;

import com.viberec.api.candidate.auth.domain.CandidateAuthMailDeliveryStatus;
import com.viberec.api.candidate.auth.domain.CandidateAuthMailOutbox;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateAuthMailOutboxRepository extends JpaRepository<CandidateAuthMailOutbox, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select mail
            from CandidateAuthMailOutbox mail
            where mail.deliveryStatus in :statuses
              and mail.deliveryAttempts < 5
              and mail.nextAttemptAt <= :now
            order by mail.createdAt asc, mail.id asc
            """)
    List<CandidateAuthMailOutbox> findDispatchable(
            @Param("statuses") List<CandidateAuthMailDeliveryStatus> statuses,
            @Param("now") OffsetDateTime now,
            Pageable pageable
    );

    Optional<CandidateAuthMailOutbox> findTopByRecipientEmailOrderByCreatedAtDescIdDesc(String recipientEmail);

    @Modifying
    @Query("""
            update CandidateAuthMailOutbox mail
            set mail.deliveryStatus = :terminalStatus,
                mail.deliveryAttempts = 5,
                mail.nextAttemptAt = null,
                mail.content = null,
                mail.lastError = 'Superseded by a newer authentication link.',
                mail.updatedAt = :now
            where mail.candidateAccount.id = :candidateAccountId
              and mail.purpose = :purpose
              and mail.deliveryStatus in :activeStatuses
            """)
    int supersedeActive(
            @Param("candidateAccountId") Long candidateAccountId,
            @Param("purpose") com.viberec.api.candidate.auth.domain.CandidateAuthTokenPurpose purpose,
            @Param("activeStatuses") List<CandidateAuthMailDeliveryStatus> activeStatuses,
            @Param("terminalStatus") CandidateAuthMailDeliveryStatus terminalStatus,
            @Param("now") OffsetDateTime now
    );
}
