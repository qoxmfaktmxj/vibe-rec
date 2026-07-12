package com.viberec.api.recruitment.notification.repository;

import com.viberec.api.recruitment.notification.domain.NotificationLog;
import com.viberec.api.recruitment.notification.domain.NotificationDeliveryStatus;
import jakarta.persistence.LockModeType;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {

    List<NotificationLog> findByApplicationIdOrderByCreatedAtDesc(Long applicationId);

    List<NotificationLog> findByApplicationCandidateAccountIdAndDeliveryStatusOrderByDeliveredAtDescIdDesc(
            Long candidateAccountId,
            NotificationDeliveryStatus deliveryStatus
    );

    Optional<NotificationLog> findByIdAndApplicationCandidateAccountId(Long id, Long candidateAccountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<NotificationLog> findByIdAndApplicationId(Long id, Long applicationId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select notification
            from NotificationLog notification
            where notification.deliveryStatus in :statuses
              and notification.nextAttemptAt <= :now
            order by notification.createdAt asc, notification.id asc
            """)
    List<NotificationLog> findDispatchable(
            @Param("statuses") List<NotificationDeliveryStatus> statuses,
            @Param("now") OffsetDateTime now,
            Pageable pageable
    );
}
