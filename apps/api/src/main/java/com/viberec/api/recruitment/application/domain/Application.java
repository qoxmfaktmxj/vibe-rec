package com.viberec.api.recruitment.application.domain;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_account_id")
    private CandidateAccount candidateAccount;

    @Column(name = "applicant_name", nullable = false, length = 120)
    private String applicantName;

    @Column(name = "applicant_email", nullable = false, length = 160)
    private String applicantEmail;

    @Column(name = "applicant_phone", nullable = false, length = 40)
    private String applicantPhone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ApplicationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "review_status", nullable = false, length = 20)
    private ApplicationReviewStatus reviewStatus;

    @Column(name = "review_note", columnDefinition = "text")
    private String reviewNote;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_status", length = 20)
    private ApplicationFinalStatus finalStatus;

    @Column(name = "final_decided_at")
    private OffsetDateTime finalDecidedAt;

    @Column(name = "final_note", columnDefinition = "text")
    private String finalNote;

    @Column(columnDefinition = "text")
    private String introduction;

    @Column(name = "core_strength", columnDefinition = "text")
    private String coreStrength;

    @Column(name = "career_years")
    private Integer careerYears;

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

    public Application(
            JobPosting jobPosting,
            CandidateAccount candidateAccount,
            String applicantName,
            String applicantEmail,
            String applicantPhone
    ) {
        this.jobPosting = jobPosting;
        this.candidateAccount = candidateAccount;
        this.applicantName = applicantName;
        this.applicantEmail = applicantEmail;
        this.applicantPhone = applicantPhone;
        this.status = ApplicationStatus.DRAFT;
        this.reviewStatus = ApplicationReviewStatus.NEW;
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

    public void updateDraft(CandidateAccount candidateAccount, String applicantName, String applicantEmail, String applicantPhone) {
        this.candidateAccount = candidateAccount;
        this.applicantName = applicantName;
        this.applicantEmail = applicantEmail;
        this.applicantPhone = applicantPhone;
        this.status = ApplicationStatus.DRAFT;
        this.draftSavedAt = OffsetDateTime.now();
    }

    public void submit(CandidateAccount candidateAccount, String applicantName, String applicantEmail, String applicantPhone) {
        this.candidateAccount = candidateAccount;
        this.applicantName = applicantName;
        this.applicantEmail = applicantEmail;
        this.applicantPhone = applicantPhone;
        this.status = ApplicationStatus.SUBMITTED;
        OffsetDateTime now = OffsetDateTime.now();
        this.draftSavedAt = now;
        this.submittedAt = now;
    }

    public void updateReviewStatus(ApplicationReviewStatus reviewStatus, String reviewNote) {
        this.reviewStatus = reviewStatus;
        this.reviewNote = reviewNote;
        this.reviewedAt = reviewStatus == ApplicationReviewStatus.NEW ? null : OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public JobPosting getJobPosting() { return jobPosting; }
    public CandidateAccount getCandidateAccount() { return candidateAccount; }
    public String getApplicantName() { return applicantName; }
    public String getApplicantEmail() { return applicantEmail; }
    public String getApplicantPhone() { return applicantPhone; }
    public ApplicationStatus getStatus() { return status; }
    public ApplicationReviewStatus getReviewStatus() { return reviewStatus; }
    public String getReviewNote() { return reviewNote; }
    public OffsetDateTime getDraftSavedAt() { return draftSavedAt; }
    public OffsetDateTime getSubmittedAt() { return submittedAt; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }

    public void updateFinalStatus(ApplicationFinalStatus status, String note) {
        this.finalStatus = status;
        this.finalNote = note;
        this.finalDecidedAt = OffsetDateTime.now();
    }

    public boolean isSubmitted() { return status == ApplicationStatus.SUBMITTED; }
    public ApplicationFinalStatus getFinalStatus() { return finalStatus; }
    public OffsetDateTime getFinalDecidedAt() { return finalDecidedAt; }
    public String getFinalNote() { return finalNote; }

    public void updateNormalizedFields(String introduction, String coreStrength, Integer careerYears) {
        this.introduction = introduction;
        this.coreStrength = coreStrength;
        this.careerYears = careerYears;
    }

    public String getIntroduction() { return introduction; }
    public String getCoreStrength() { return coreStrength; }
    public Integer getCareerYears() { return careerYears; }

    public boolean belongsToCandidate(Long candidateAccountId) {
        return candidateAccount != null && candidateAccount.getId() != null && candidateAccount.getId().equals(candidateAccountId);
    }
}