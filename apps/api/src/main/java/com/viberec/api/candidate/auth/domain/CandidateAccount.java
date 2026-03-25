package com.viberec.api.candidate.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_account", schema = "platform")
public class CandidateAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(name = "normalized_email", nullable = false, unique = true, length = 160)
    private String normalizedEmail;

    @Column(name = "display_name", nullable = false, length = 120)
    private String displayName;

    @Column(name = "phone_number", nullable = false, length = 40)
    private String phoneNumber;

    @Column(name = "password_hash", nullable = false, columnDefinition = "text")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CandidateAccountStatus status;

    @Column(name = "last_authenticated_at")
    private OffsetDateTime lastAuthenticatedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateAccount() {
    }

    public CandidateAccount(String email, String normalizedEmail, String displayName, String phoneNumber) {
        this.email = email;
        this.normalizedEmail = normalizedEmail;
        this.displayName = displayName;
        this.phoneNumber = phoneNumber;
        this.status = CandidateAccountStatus.ACTIVE;
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

    public void markAuthenticated(OffsetDateTime authenticatedAt) {
        this.lastAuthenticatedAt = authenticatedAt;
        this.status = CandidateAccountStatus.ACTIVE;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getNormalizedEmail() { return normalizedEmail; }
    public String getDisplayName() { return displayName; }
    public String getPhone() { return phoneNumber; }
    public CandidateAccountStatus getStatus() { return status; }
    public OffsetDateTime getLastAuthenticatedAt() { return lastAuthenticatedAt; }
    public boolean isActive() { return status == CandidateAccountStatus.ACTIVE; }
}