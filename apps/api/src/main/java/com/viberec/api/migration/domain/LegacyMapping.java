package com.viberec.api.migration.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "legacy_mapping", schema = "recruit")
public class LegacyMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_type", nullable = false, length = 40)
    private String entityType;

    @Column(name = "legacy_key", nullable = false, length = 200)
    private String legacyKey;

    @Column(name = "new_id", nullable = false)
    private Long newId;

    @Column(name = "migrated_at", nullable = false)
    private OffsetDateTime migratedAt;

    @Column(columnDefinition = "text")
    private String notes;

    protected LegacyMapping() {
    }

    public LegacyMapping(String entityType, String legacyKey, Long newId, String notes) {
        this.entityType = entityType;
        this.legacyKey = legacyKey;
        this.newId = newId;
        this.notes = notes;
    }

    @PrePersist
    void onCreate() {
        if (migratedAt == null) {
            migratedAt = OffsetDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getEntityType() {
        return entityType;
    }

    public String getLegacyKey() {
        return legacyKey;
    }

    public Long getNewId() {
        return newId;
    }

    public OffsetDateTime getMigratedAt() {
        return migratedAt;
    }

    public String getNotes() {
        return notes;
    }
}
