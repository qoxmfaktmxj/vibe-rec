package com.viberec.api.recruitment.application.domain;

import com.viberec.api.recruitment.jobposting.domain.JobPosting;
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
@Table(name = "application", schema = "recruit")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_id", nullable = false)
    private JobPosting jobPosting;

    @Column(name = "applicant_name", nullable = false, length = 120)
    private String applicantName;

    @Column(name = "applicant_email", nullable = false, length = 160)
    private String applicantEmail;

    @Column(name = "applicant_phone", nullable = false, length = 40)
    private String applicantPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    @Column(name = "draft_saved_at", nullable = false)
    private OffsetDateTime draftSavedAt;

    @Column(name = "submitted_at")
    private OffsetDateTime submittedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Application() {
    }

    public Application(JobPosting jobPosting, String applicantName, String applicantEmail, String applicantPhone) {
        this.jobPosting = jobPosting;
        this.applicantName = applicantName;
        this.applicantEmail = applicantEmail;
        this.applicantPhone = applicantPhone;
        this.status = ApplicationStatus.DRAFT;
        this.draftSavedAt = OffsetDateTime.now();
    }

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (draftSavedAt == null) {
            draftSavedAt = now;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public void updateDraft(String applicantName, String applicantPhone) {
        this.applicantName = applicantName;
        this.applicantPhone = applicantPhone;
        this.status = ApplicationStatus.DRAFT;
        this.draftSavedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public JobPosting getJobPosting() {
        return jobPosting;
    }

    public String getApplicantEmail() {
        return applicantEmail;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public OffsetDateTime getDraftSavedAt() {
        return draftSavedAt;
    }
}

