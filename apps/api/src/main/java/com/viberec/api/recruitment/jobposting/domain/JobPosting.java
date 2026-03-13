package com.viberec.api.recruitment.jobposting.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_posting", schema = "recruit")
public class JobPosting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "legacy_anno_id")
    private Long legacyAnnoId;

    @Column(name = "public_key", nullable = false, unique = true, length = 80)
    private String publicKey;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 200)
    private String headline;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "employment_type", nullable = false, length = 40)
    private String employmentType;

    @Column(nullable = false, length = 120)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private JobPostingStatus status;

    @Column(nullable = false)
    private boolean published;

    @Column(name = "opens_at", nullable = false)
    private OffsetDateTime opensAt;

    @Column(name = "closes_at", nullable = false)
    private OffsetDateTime closesAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "jobPosting", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @OrderBy("stepOrder asc")
    private List<JobPostingStep> steps = new ArrayList<>();

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

    public Long getId() {
        return id;
    }

    public Long getLegacyAnnoId() {
        return legacyAnnoId;
    }

    public String getPublicKey() {
        return publicKey;
    }

    public String getTitle() {
        return title;
    }

    public String getHeadline() {
        return headline;
    }

    public String getDescription() {
        return description;
    }

    public String getEmploymentType() {
        return employmentType;
    }

    public String getLocation() {
        return location;
    }

    public JobPostingStatus getStatus() {
        return status;
    }

    public boolean isPublished() {
        return published;
    }

    public OffsetDateTime getOpensAt() {
        return opensAt;
    }

    public OffsetDateTime getClosesAt() {
        return closesAt;
    }

    public List<JobPostingStep> getSteps() {
        return steps;
    }
}

