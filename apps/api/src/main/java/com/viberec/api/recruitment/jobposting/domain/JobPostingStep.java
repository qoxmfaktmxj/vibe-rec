package com.viberec.api.recruitment.jobposting.domain;

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
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.time.Duration;

@Entity
@Table(name = "job_posting_step", schema = "recruit")
public class JobPostingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @Column(name = "step_order", nullable = false)
    private short stepOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "step_type", nullable = false, length = 40)
    private JobPostingStepType stepType;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "starts_at")
    private OffsetDateTime startsAt;

    @Column(name = "ends_at")
    private OffsetDateTime endsAt;

    protected JobPostingStep() {
    }

    public JobPostingStep(
            JobPosting jobPosting,
            short stepOrder,
            JobPostingStepType stepType,
            String title,
            String description,
            OffsetDateTime startsAt,
            OffsetDateTime endsAt
    ) {
        this.jobPosting = jobPosting;
        this.stepOrder = stepOrder;
        this.stepType = stepType;
        this.title = title;
        this.description = description;
        this.startsAt = startsAt;
        this.endsAt = endsAt;
    }

    void shiftSchedule(Duration duration) {
        if (startsAt != null) {
            startsAt = startsAt.plus(duration);
        }
        if (endsAt != null) {
            endsAt = endsAt.plus(duration);
        }
    }

    public Long getId() {
        return id;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public short getStepOrder() {
        return stepOrder;
    }

    public JobPostingStepType getStepType() {
        return stepType;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public OffsetDateTime getStartsAt() {
        return startsAt;
    }

    public OffsetDateTime getEndsAt() {
        return endsAt;
    }
}

