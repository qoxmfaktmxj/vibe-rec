package com.viberec.api.recruitment.interview.domain;

import com.viberec.api.recruitment.application.domain.Application;
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

    @Enumerated(EnumType.STRING)
    @Column(name = "interview_type", nullable = false, columnDefinition = "recruit.interview_type")
    private InterviewType interviewType;

    @Column(name = "scheduled_at", nullable = false)
    private OffsetDateTime scheduledAt;

    @Column(name = "duration_minutes", nullable = false)
    private int durationMinutes;

    @Column(length = 300)
    private String location;

    @Column(name = "online_link", length = 500)
    private String onlineLink;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "recruit.interview_status")
    private InterviewStatus status;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Interview() {
    }

    public Interview(Application application, InterviewType interviewType,
                     OffsetDateTime scheduledAt, int durationMinutes,
                     String location, String onlineLink, String note) {
        this.application = application;
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

    public void updateStatus(InterviewStatus status) {
        this.status = status;
    }

    public void update(InterviewType interviewType, OffsetDateTime scheduledAt,
                       int durationMinutes, String location, String onlineLink, String note) {
        this.interviewType = interviewType;
        this.scheduledAt = scheduledAt;
        this.durationMinutes = durationMinutes;
        this.location = location;
        this.onlineLink = onlineLink;
        this.note = note;
    }

    public Long getId() { return id; }
    public Application getApplication() { return application; }
    public InterviewType getInterviewType() { return interviewType; }
    public OffsetDateTime getScheduledAt() { return scheduledAt; }
    public int getDurationMinutes() { return durationMinutes; }
    public String getLocation() { return location; }
    public String getOnlineLink() { return onlineLink; }
    public InterviewStatus getStatus() { return status; }
    public String getNote() { return note; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
