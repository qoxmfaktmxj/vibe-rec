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
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "application_event", schema = "recruit")
public class ApplicationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "event_type", nullable = false, length = 60)
    private String eventType;

    @Column(name = "from_state", length = 60)
    private String fromState;

    @Column(name = "to_state", length = 60)
    private String toState;

    @Column(name = "actor_type", nullable = false, length = 20)
    private String actorType;

    @Column(name = "actor_id")
    private Long actorId;

    @Column(columnDefinition = "text")
    private String reason;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private String metadata;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected ApplicationEvent() {
    }

    public ApplicationEvent(
            Application application,
            String eventType,
            String fromState,
            String toState,
            String actorType,
            Long actorId,
            String reason,
            String metadata
    ) {
        this.application = application;
        this.eventType = eventType;
        this.fromState = fromState;
        this.toState = toState;
        this.actorType = actorType;
        this.actorId = actorId;
        this.reason = reason;
        this.metadata = metadata == null ? "{}" : metadata;
    }

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Application getApplication() { return application; }
    public String getEventType() { return eventType; }
    public String getFromState() { return fromState; }
    public String getToState() { return toState; }
    public String getActorType() { return actorType; }
    public Long getActorId() { return actorId; }
    public String getReason() { return reason; }
    public String getMetadata() { return metadata; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
