package com.viberec.api.candidate.auth.domain;

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
@Table(name = "candidate_auth_mail_outbox", schema = "platform")
public class CandidateAuthMailOutbox {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_account_id", nullable = false)
    private CandidateAccount candidateAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CandidateAuthTokenPurpose purpose;

    @Column(name = "recipient_email", nullable = false, length = 160)
    private String recipientEmail;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(columnDefinition = "text")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 20)
    private CandidateAuthMailDeliveryStatus deliveryStatus;

    @Column(name = "delivery_attempts", nullable = false)
    private int deliveryAttempts;

    @Column(name = "next_attempt_at")
    private OffsetDateTime nextAttemptAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateAuthMailOutbox() {
    }

    public CandidateAuthMailOutbox(
            CandidateAccount candidateAccount,
            CandidateAuthTokenPurpose purpose,
            String recipientEmail,
            String subject,
            String content
    ) {
        this.candidateAccount = candidateAccount;
        this.purpose = purpose;
        this.recipientEmail = recipientEmail;
        this.subject = subject;
        this.content = content;
        this.deliveryStatus = CandidateAuthMailDeliveryStatus.PENDING;
        this.nextAttemptAt = OffsetDateTime.now();
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void markDelivered() {
        deliveryAttempts++;
        deliveryStatus = CandidateAuthMailDeliveryStatus.DELIVERED;
        deliveredAt = OffsetDateTime.now();
        nextAttemptAt = null;
        lastError = null;
        content = null;
    }

    public void markFailed(String error) {
        deliveryAttempts++;
        deliveryStatus = CandidateAuthMailDeliveryStatus.FAILED;
        lastError = truncate(error, 2000);
        nextAttemptAt = deliveryAttempts < 5
                ? OffsetDateTime.now().plusSeconds(Math.min(300, 5L << Math.min(deliveryAttempts - 1, 5)))
                : null;
        if (nextAttemptAt == null) {
            content = null;
        }
    }

    private String truncate(String value, int maxLength) {
        return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    public Long getId() { return id; }
    public String getRecipientEmail() { return recipientEmail; }
    public String getSubject() { return subject; }
    public String getContent() { return content; }
    public CandidateAuthMailDeliveryStatus getDeliveryStatus() { return deliveryStatus; }
    public int getDeliveryAttempts() { return deliveryAttempts; }
    public OffsetDateTime getNextAttemptAt() { return nextAttemptAt; }
    public OffsetDateTime getDeliveredAt() { return deliveredAt; }
    public String getLastError() { return lastError; }
}
