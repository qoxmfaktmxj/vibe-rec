package com.viberec.api.admin.privacy.web;

import com.viberec.api.candidate.privacy.domain.CandidateDataRequestStatus;
import com.viberec.api.candidate.privacy.domain.CandidateDataRequestType;
import com.viberec.api.candidate.privacy.web.CandidateDataRequestEventResponse;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminCandidateDataRequestResponse(
        Long id,
        Long candidateAccountId,
        String candidateName,
        String candidateEmail,
        String candidatePhone,
        CandidateDataRequestType requestType,
        CandidateDataRequestStatus status,
        String candidateMessage,
        String resolutionNote,
        Long reviewedBy,
        OffsetDateTime requestedAt,
        OffsetDateTime reviewedAt,
        OffsetDateTime completedAt,
        OffsetDateTime cancelledAt,
        OffsetDateTime updatedAt,
        List<CandidateDataRequestEventResponse> events
) {
}
