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
@Table(name = "migration_run", schema = "recruit")
public class MigrationRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_name", nullable = false, length = 200)
    private String runName;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "total_count")
    private Integer totalCount;

    @Column(name = "success_count")
    private Integer successCount;

    @Column(name = "fail_count")
    private Integer failCount;

    @Column(name = "started_at", nullable = false)
    private OffsetDateTime startedAt;

    @Column(name = "completed_at")
    private OffsetDateTime completedAt;

    @Column(name = "error_log", columnDefinition = "text")
    private String errorLog;

    protected MigrationRun() {
    }

    public MigrationRun(String runName, int totalCount) {
        this.runName = runName;
        this.status = "RUNNING";
        this.totalCount = totalCount;
        this.successCount = 0;
        this.failCount = 0;
    }

    @PrePersist
    void onCreate() {
        if (startedAt == null) {
            startedAt = OffsetDateTime.now();
        }
    }

    public void complete(int successCount, int failCount) {
        this.status = "COMPLETED";
        this.successCount = successCount;
        this.failCount = failCount;
        this.completedAt = OffsetDateTime.now();
    }

    public void fail(String errorLog) {
        this.status = "FAILED";
        this.errorLog = errorLog;
        this.completedAt = OffsetDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public String getRunName() {
        return runName;
    }

    public String getStatus() {
        return status;
    }

    public Integer getTotalCount() {
        return totalCount;
    }

    public Integer getSuccessCount() {
        return successCount;
    }

    public Integer getFailCount() {
        return failCount;
    }

    public OffsetDateTime getStartedAt() {
        return startedAt;
    }

    public OffsetDateTime getCompletedAt() {
        return completedAt;
    }

    public String getErrorLog() {
        return errorLog;
    }
}
