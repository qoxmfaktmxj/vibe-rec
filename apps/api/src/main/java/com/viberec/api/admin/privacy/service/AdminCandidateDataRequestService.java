package com.viberec.api.admin.privacy.service;

import com.viberec.api.admin.privacy.web.AdminCandidateDataRequestResponse;
import com.viberec.api.admin.privacy.web.UpdateCandidateDataRequestRequest;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequest;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestEvent;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestEventRepository;
import com.viberec.api.candidate.privacy.repository.CandidateDataRequestRepository;
import com.viberec.api.candidate.privacy.web.CandidateDataRequestEventResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AdminCandidateDataRequestService {

    private final CandidateDataRequestRepository requestRepository;
    private final CandidateDataRequestEventRepository eventRepository;

    public AdminCandidateDataRequestService(
            CandidateDataRequestRepository requestRepository,
            CandidateDataRequestEventRepository eventRepository
    ) {
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
    }

    public List<AdminCandidateDataRequestResponse> getRequests() {
        return requestRepository.findAllByOrderByRequestedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AdminCandidateDataRequestResponse update(
            Long requestId,
            Long adminAccountId,
            UpdateCandidateDataRequestRequest request
    ) {
        CandidateDataRequest dataRequest = requestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Data request not found."));
        CandidateDataRequestStatus previousStatus = dataRequest.getStatus();
        if (previousStatus == request.status()) {
            return toResponse(dataRequest);
        }

        String note = normalize(request.resolutionNote());
        switch (previousStatus) {
            case REQUESTED -> {
                if (request.status() == CandidateDataRequestStatus.IN_REVIEW) {
                    dataRequest.startReview(adminAccountId, note);
                } else if (request.status() == CandidateDataRequestStatus.REJECTED) {
                    requireResolutionNote(note);
                    dataRequest.reject(adminAccountId, note);
                } else {
                    throw invalidTransition(previousStatus, request.status());
                }
            }
            case IN_REVIEW -> {
                if (request.status() == CandidateDataRequestStatus.COMPLETED) {
                    requireResolutionNote(note);
                    dataRequest.complete(adminAccountId, note);
                } else if (request.status() == CandidateDataRequestStatus.REJECTED) {
                    requireResolutionNote(note);
                    dataRequest.reject(adminAccountId, note);
                } else {
                    throw invalidTransition(previousStatus, request.status());
                }
            }
            case COMPLETED, REJECTED, CANCELLED -> throw invalidTransition(previousStatus, request.status());
        }

        eventRepository.save(new CandidateDataRequestEvent(
                dataRequest,
                previousStatus.name(),
                dataRequest.getStatus().name(),
                "ADMIN",
                adminAccountId,
                note
        ));
        return toResponse(dataRequest);
    }

    private AdminCandidateDataRequestResponse toResponse(CandidateDataRequest dataRequest) {
        var candidate = dataRequest.getCandidateAccount();
        return new AdminCandidateDataRequestResponse(
                dataRequest.getId(),
                candidate.getId(),
                candidate.getDisplayName(),
                candidate.getEmail(),
                candidate.getPhone(),
                dataRequest.getRequestType(),
                dataRequest.getStatus(),
                dataRequest.getCandidateMessage(),
                dataRequest.getResolutionNote(),
                dataRequest.getReviewedBy(),
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

    private void requireResolutionNote(String note) {
        if (note == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A resolution note is required.");
        }
    }

    private ResponseStatusException invalidTransition(
            CandidateDataRequestStatus from,
            CandidateDataRequestStatus to
    ) {
        return new ResponseStatusException(HttpStatus.CONFLICT, "Cannot move data request from " + from + " to " + to + ".");
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
