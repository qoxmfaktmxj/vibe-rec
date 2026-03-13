package com.viberec.api.recruitment.application.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "application_resume_raw", schema = "recruit")
public class ApplicationResumeRaw {

    @Id
    @Column(name = "application_id")
    private Long applicationId;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ApplicationResumeRaw() {
    }

    public ApplicationResumeRaw(Application application, Map<String, Object> payload) {
        this.application = application;
        this.payload = payload;
    }

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = OffsetDateTime.now();
    }

    public void updatePayload(Map<String, Object> payload) {
        this.payload = payload;
    }

    public Map<String, Object> getPayload() {
        return payload;
    }
}
