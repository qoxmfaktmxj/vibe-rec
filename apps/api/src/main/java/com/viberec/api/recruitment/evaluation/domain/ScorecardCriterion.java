package com.viberec.api.recruitment.evaluation.domain;

import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
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
import java.time.OffsetDateTime;

@Entity
@Table(name = "scorecard_criterion", schema = "recruit")
public class ScorecardCriterion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_step_id", nullable = false)
    private JobPostingStep jobPostingStep;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(name = "normalized_name", nullable = false, length = 120)
    private String normalizedName;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private short weight;

    @Column(nullable = false)
    private boolean required;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ScorecardCriterion() {
    }

    public ScorecardCriterion(
            JobPostingStep jobPostingStep,
            String name,
            String normalizedName,
            String description,
            short weight,
            boolean required,
            short sortOrder
    ) {
        this.jobPostingStep = jobPostingStep;
        this.name = name;
        this.normalizedName = normalizedName;
        this.description = description;
        this.weight = weight;
        this.required = required;
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
    public JobPostingStep getJobPostingStep() { return jobPostingStep; }
    public String getName() { return name; }
    public String getNormalizedName() { return normalizedName; }
    public String getDescription() { return description; }
    public short getWeight() { return weight; }
    public boolean isRequired() { return required; }
    public short getSortOrder() { return sortOrder; }
}
