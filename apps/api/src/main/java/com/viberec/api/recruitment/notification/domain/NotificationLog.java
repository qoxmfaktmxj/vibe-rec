package com.viberec.api.recruitment.notification.domain;

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
@Table(name = "notification_log", schema = "recruit")
public class NotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private NotificationTemplate template;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "recruit.notification_channel")
    private NotificationChannel channel;

    @Column(nullable = false, length = 300)
    private String recipient;

    @Column(nullable = false, length = 300)
    private String subject;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "recruit.notification_status")
    private NotificationStatus status;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected NotificationLog() {
    }

    public NotificationLog(Application application, NotificationTemplate template,
                           NotificationChannel channel, String recipient,
                           String subject, String body) {
        this.application = application;
        this.template = template;
        this.channel = channel;
        this.recipient = recipient;
        this.subject = subject;
        this.body = body;
        this.status = NotificationStatus.PENDING;
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

    public void markSent() {
        this.status = NotificationStatus.SENT;
        this.sentAt = OffsetDateTime.now();
    }

    public void markFailed() {
        this.status = NotificationStatus.FAILED;
    }

    public Long getId() { return id; }
    public Application getApplication() { return application; }
    public NotificationTemplate getTemplate() { return template; }
    public NotificationChannel getChannel() { return channel; }
    public String getRecipient() { return recipient; }
    public String getSubject() { return subject; }
    public String getBody() { return body; }
    public NotificationStatus getStatus() { return status; }
    public OffsetDateTime getSentAt() { return sentAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
