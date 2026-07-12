package com.viberec.api.candidate.privacy.service;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequest;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestEvent;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestEventRepository;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestRepository;
import com.viberec.api.candidate.privacy.web.CandidateDataRequestEventResponse;
import com.viberec.api.candidate.privacy.web.CandidateDataRequestResponse;
import com.viberec.api.candidate.privacy.web.CreateCandidateDataRequest;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class CandidateDataRequestService {

    private static final List<CandidateDataRequestStatus> ACTIVE_STATUSES = List.of(
            CandidateDataRequestStatus.REQUESTED,
            CandidateDataRequestStatus.IN_REVIEW
    );

    private final CandidateDataRequestRepository requestRepository;
    private final CandidateDataRequestEventRepository eventRepository;

    public CandidateDataRequestService(
            CandidateDataRequestRepository requestRepository,
            CandidateDataRequestEventRepository eventRepository
    ) {
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
    }

    @Transactional
    public CandidateDataRequestResponse create(
            CandidateAccount candidateAccount,
            CreateCandidateDataRequest request
    ) {
        if (requestRepository.existsByCandidateAccountIdAndRequestTypeAndStatusIn(
                candidateAccount.getId(),
                request.requestType(),
                ACTIVE_STATUSES
        )) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An active request of this type already exists.");
        }

        try {
            CandidateDataRequest created = requestRepository.saveAndFlush(new CandidateDataRequest(
                    candidateAccount,
                    request.requestType(),
                    normalize(request.message())
            ));
            eventRepository.save(new CandidateDataRequestEvent(
                    created,
                    null,
                    CandidateDataRequestStatus.REQUESTED.name(),
                    "CANDIDATE",
                    candidateAccount.getId(),
                    normalize(request.message())
            ));
            return toResponse(created);
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An active request of this type already exists.");
        }
    }

    public List<CandidateDataRequestResponse> getRequests(CandidateAccount candidateAccount) {
        return requestRepository.findByCandidateAccountIdOrderByRequestedAtDescIdDesc(candidateAccount.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CandidateDataRequestResponse cancel(Long requestId, CandidateAccount candidateAccount) {
        CandidateDataRequest dataRequest = requestRepository
                .findByIdAndCandidateAccountId(requestId, candidateAccount.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Data request not found."));
        if (dataRequest.getStatus() != CandidateDataRequestStatus.REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only requested items can be cancelled.");
        }

        CandidateDataRequestStatus previousStatus = dataRequest.getStatus();
        dataRequest.cancel();
        eventRepository.save(new CandidateDataRequestEvent(
                dataRequest,
                previousStatus.name(),
                dataRequest.getStatus().name(),
                "CANDIDATE",
                candidateAccount.getId(),
                null
        ));
        return toResponse(dataRequest);
    }

    private CandidateDataRequestResponse toResponse(CandidateDataRequest dataRequest) {
        return new CandidateDataRequestResponse(
                dataRequest.getId(),
                dataRequest.getRequestType(),
                dataRequest.getStatus(),
                dataRequest.getCandidateMessage(),
                dataRequest.getResolutionNote(),
                dataRequest.getRequestedAt(),
                dataRequest.getReviewedAt(),
                dataRequest.getCompletedAt(),
                dataRequest.getCancelledAt(),
                dataRequest.getUpdatedAt(),
                eventRepository.findByRequestIdOrderByCreatedAtAscIdAsc(dataRequest.getId()).stream()
                        .map(event -> new CandidateDataRequestEventResponse(
                                event.getId(),
                                event.getFromStatus(),
                                event.getToStatus(),
                                event.getActorType(),
                                event.getNote(),
                                event.getCreatedAt()
                        ))
                        .toList()
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
