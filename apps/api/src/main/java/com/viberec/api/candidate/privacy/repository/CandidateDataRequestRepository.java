package com.viberec.api.candidate.privacy.repository;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequest;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateDataRequestRepository extends JpaRepository<CandidateDataRequest, Long> {
    List<CandidateDataRequest> findByCandidateAccountIdOrderByRequestedAtDescIdDesc(Long candidateAccountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CandidateDataRequest> findByIdAndCandidateAccountId(Long id, Long candidateAccountId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select request from CandidateDataRequest request where request.id = :id")
    Optional<CandidateDataRequest> findByIdForUpdate(@Param("id") Long id);

    boolean existsByCandidateAccountIdAndRequestTypeAndStatusIn(
            Long candidateAccountId,
            CandidateDataRequestType requestType,
            Collection<CandidateDataRequestStatus> statuses
    );
    List<CandidateDataRequest> findAllByOrderByRequestedAtDescIdDesc();
}
