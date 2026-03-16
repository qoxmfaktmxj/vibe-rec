package com.viberec.api.recruitment.application.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "application_certification", schema = "recruit")
public class ApplicationCertification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

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

    protected ApplicationCertification() {
    }

    public ApplicationCertification(Application application, String certificationName,
                                    String issuer, LocalDate issuedDate, LocalDate expiryDate,
                                    int sortOrder) {
        this.application = application;
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
    public Application getApplication() { return application; }
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
