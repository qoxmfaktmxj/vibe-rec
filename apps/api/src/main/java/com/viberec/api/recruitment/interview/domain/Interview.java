package com.viberec.api.recruitment.interview.domain;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.jobposting.domain.JobPostingStep;
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
@Table(name = "interview", schema = "recruit")
public class Interview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_step_id", nullable = false)
    private JobPostingStep jobPostingStep;

    @Column(name = "scheduled_at")
    private OffsetDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false, length = 20)
    private InterviewType interviewType;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(length = 300)
    private String location;

    @Column(name = "online_link", length = 1000)
    private String onlineLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InterviewStatus status;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Interview() {
    }

    public Interview(
            Application application,
            JobPostingStep jobPostingStep,
            InterviewType interviewType,
            OffsetDateTime scheduledAt,
            int durationMinutes,
            String location,
            String onlineLink,
            String note
    ) {
        this.application = application;
        this.jobPostingStep = jobPostingStep;
        this.interviewType = interviewType;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.location = location;
        this.onlineLink = onlineLink;
        this.status = InterviewStatus.SCHEDULED;
        this.note = note;
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

    public void complete(String note) {
        this.status = InterviewStatus.COMPLETED;
        this.note = note;
    }

    public void cancel(String note) {
        this.status = InterviewStatus.CANCELLED;
        this.note = note;
    }

    public void markNoShow(String note) {
        this.status = InterviewStatus.NO_SHOW;
        this.note = note;
    }

    public void updateStatus(InterviewStatus status, String note) {
        this.status = status;
        this.note = note;
    }

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public JobPostingStep getJobPostingStep() {
        return jobPostingStep;
    }

    public OffsetDateTime getScheduledAt() {
        return scheduledAt;
    }

    public InterviewType getInterviewType() {
        return interviewType;
    }

    public int getDurationMinutes() {
        return durationMinutes;
    }

    public String getLocation() {
        return location;
    }

    public String getOnlineLink() {
        return onlineLink;
    }

    public InterviewStatus getStatus() {
        return status;
    }

    public String getNote() {
        return note;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
