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
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_auth_token", schema = "platform")
public class CandidateAuthToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "candidate_account_id", nullable = false)
    private CandidateAccount candidateAccount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CandidateAuthTokenPurpose purpose;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "used_at")
    private OffsetDateTime usedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected CandidateAuthToken() {
    }

    public CandidateAuthToken(
            CandidateAccount candidateAccount,
            CandidateAuthTokenPurpose purpose,
            String tokenHash,
            OffsetDateTime expiresAt
    ) {
        this.candidateAccount = candidateAccount;
        this.purpose = purpose;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public void markUsed(OffsetDateTime usedAt) {
        if (this.usedAt != null) {
            throw new IllegalStateException("Authentication token was already used.");
        }
        this.usedAt = usedAt;
    }

    public CandidateAccount getCandidateAccount() { return candidateAccount; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
