package com.viberec.api.candidate.privacy.domain;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_data_request", schema = "platform")
public class CandidateDataRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_account_id", nullable = false)
    private CandidateAccount candidateAccount;

    @Enumerated(EnumType.STRING)
    @Column(name = "request_type", nullable = false, length = 30)
    private CandidateDataRequestType requestType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CandidateDataRequestStatus status;

    @Column(name = "candidate_message", columnDefinition = "text")
    private String candidateMessage;

    @Column(name = "resolution_note", columnDefinition = "text")
    private String resolutionNote;

    @Column(name = "reviewed_by")
    private Long reviewedBy;

    @Column(name = "requested_at", nullable = false)
    private OffsetDateTime requestedAt;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "cancelled_at")
    private OffsetDateTime cancelledAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateDataRequest() {
    }

    public CandidateDataRequest(
            CandidateAccount candidateAccount,
            CandidateDataRequestType requestType,
            String candidateMessage
    ) {
        this.candidateAccount = candidateAccount;
        this.requestType = requestType;
        this.candidateMessage = candidateMessage;
        this.status = CandidateDataRequestStatus.REQUESTED;
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        requestedAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void startReview(Long adminAccountId, String note) {
        status = CandidateDataRequestStatus.IN_REVIEW;
        reviewedBy = adminAccountId;
        reviewedAt = OffsetDateTime.now();
        resolutionNote = note;
    }

    public void complete(Long adminAccountId, String note) {
        status = CandidateDataRequestStatus.COMPLETED;
        reviewedBy = adminAccountId;
        reviewedAt = reviewedAt == null ? OffsetDateTime.now() : reviewedAt;
        completedAt = OffsetDateTime.now();
        resolutionNote = note;
    }

    public void reject(Long adminAccountId, String note) {
        status = CandidateDataRequestStatus.REJECTED;
        reviewedBy = adminAccountId;
        reviewedAt = OffsetDateTime.now();
        resolutionNote = note;
    }

    public void cancel() {
        status = CandidateDataRequestStatus.CANCELLED;
        cancelledAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public CandidateAccount getCandidateAccount() { return candidateAccount; }
    public CandidateDataRequestType getRequestType() { return requestType; }
    public CandidateDataRequestStatus getStatus() { return status; }
    public String getCandidateMessage() { return candidateMessage; }
    public String getResolutionNote() { return resolutionNote; }
    public Long getReviewedBy() { return reviewedBy; }
    public OffsetDateTime getRequestedAt() { return requestedAt; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public OffsetDateTime getCompletedAt() { return completedAt; }
    public OffsetDateTime getCancelledAt() { return cancelledAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
