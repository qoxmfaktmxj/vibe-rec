package com.viberec.api.candidate.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_profile_certification", schema = "platform")
public class CandidateProfileCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_account_id", nullable = false)
    private Long candidateAccountId;

    @Column(name = "certification_name", nullable = false, length = 200)
    private String certificationName;

    @Column(length = 200)
    private String issuer;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateProfileCertification() {}

    public CandidateProfileCertification(Long candidateAccountId, String certificationName,
                                         String issuer, LocalDate issuedDate, LocalDate expiryDate,
                                         int sortOrder) {
        this.candidateAccountId = candidateAccountId;
        this.certificationName = certificationName;
        this.issuer = issuer;
        this.issuedDate = issuedDate;
        this.expiryDate = expiryDate;
        this.sortOrder = sortOrder;
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

    public Long getId() { return id; }
    public Long getCandidateAccountId() { return candidateAccountId; }
    public String getCertificationName() { return certificationName; }
    public String getIssuer() { return issuer; }
    public LocalDate getIssuedDate() { return issuedDate; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public int getSortOrder() { return sortOrder; }

    public void update(String certificationName, String issuer, LocalDate issuedDate,
                       LocalDate expiryDate, int sortOrder) {
        this.certificationName = certificationName;
        this.issuer = issuer;
        this.issuedDate = issuedDate;
        this.expiryDate = expiryDate;
        this.sortOrder = sortOrder;
    }
}
