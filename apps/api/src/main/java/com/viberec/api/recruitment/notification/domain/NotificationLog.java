package com.viberec.api.recruitment.notification.domain;

import com.viberec.api.recruitment.application.domain.Application;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "sent_by")
    private Long sentBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private NotificationTemplate template;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private NotificationChannel channel;

    @Enumerated(EnumType.STRING)
    @Column(name = "delivery_status", nullable = false, length = 20)
    private NotificationDeliveryStatus deliveryStatus;

    @Column(name = "delivery_attempts", nullable = false)
    private int deliveryAttempts;

    @Column(name = "manual_retry_count", nullable = false)
    private int manualRetryCount;

    @Column(name = "next_attempt_at")
    private OffsetDateTime nextAttemptAt;

    @Column(name = "delivered_at")
    private OffsetDateTime deliveredAt;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @Column(name = "last_error", columnDefinition = "text")
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected NotificationLog() {
    }

    public NotificationLog(Application application, String type, String title, String content, Long sentBy) {
        this(application, type, title, content, sentBy, null);
    }

    public NotificationLog(
            Application application,
            String type,
            String title,
            String content,
            Long sentBy,
            NotificationTemplate template
    ) {
        this.application = application;
        this.type = type;
        this.title = title;
        this.content = content;
        this.sentBy = sentBy;
        this.template = template;
        this.channel = NotificationChannel.IN_APP;
        this.deliveryStatus = NotificationDeliveryStatus.PENDING;
        this.deliveryAttempts = 0;
        this.manualRetryCount = 0;
        this.nextAttemptAt = OffsetDateTime.now();
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

    public void markDelivered() {
        deliveryAttempts++;
        deliveryStatus = NotificationDeliveryStatus.DELIVERED;
        deliveredAt = OffsetDateTime.now();
        nextAttemptAt = null;
        lastError = null;
    }

    public void markDeliveryFailed(String errorMessage) {
        deliveryAttempts++;
        deliveryStatus = NotificationDeliveryStatus.FAILED;
        lastError = truncate(errorMessage, 2000);
        if (deliveryAttempts < 5) {
            long retryDelaySeconds = Math.min(300, 5L << Math.min(deliveryAttempts - 1, 5));
            nextAttemptAt = OffsetDateTime.now().plusSeconds(retryDelaySeconds);
        } else {
            nextAttemptAt = null;
        }
    }

    public void markRead() {
        if (deliveryStatus != NotificationDeliveryStatus.DELIVERED) {
            throw new IllegalStateException("Only delivered notifications can be marked as read.");
        }
        if (readAt == null) {
            readAt = OffsetDateTime.now();
        }
    }

    public void scheduleManualRetry() {
        if (deliveryStatus != NotificationDeliveryStatus.FAILED) {
            throw new IllegalStateException("Only failed notifications can be retried.");
        }
        deliveryStatus = NotificationDeliveryStatus.PENDING;
        nextAttemptAt = OffsetDateTime.now();
        manualRetryCount++;
    }

    private String truncate(String value, int maxLength) {
        if (value == null || value.length() <= maxLength) {
            return value;
        }
        return value.substring(0, maxLength);
    }

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getContent() {
        return content;
    }

    public Long getSentBy() {
        return sentBy;
    }

    public NotificationTemplate getTemplate() { return template; }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public NotificationChannel getChannel() { return channel; }
    public NotificationDeliveryStatus getDeliveryStatus() { return deliveryStatus; }
    public int getDeliveryAttempts() { return deliveryAttempts; }
    public int getManualRetryCount() { return manualRetryCount; }
    public OffsetDateTime getNextAttemptAt() { return nextAttemptAt; }
    public OffsetDateTime getDeliveredAt() { return deliveredAt; }
    public OffsetDateTime getReadAt() { return readAt; }
    public String getLastError() { return lastError; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
