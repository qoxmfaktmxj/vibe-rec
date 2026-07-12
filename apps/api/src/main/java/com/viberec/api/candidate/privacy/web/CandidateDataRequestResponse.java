package com.viberec.api.candidate.privacy.web;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestType;
import java.time.OffsetDateTime;
import java.util.List;

public record CandidateDataRequestResponse(
        Long id,
        CandidateDataRequestType requestType,
        CandidateDataRequestStatus status,
        String candidateMessage,
        String resolutionNote,
        OffsetDateTime requestedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime updatedAt,
        List<CandidateDataRequestEventResponse> events
) {
}
