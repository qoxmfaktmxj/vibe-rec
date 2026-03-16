package com.viberec.api.recruitment.hire.domain;

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
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "hire_decision", schema = "recruit")
public class HireDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false, unique = true)
    private Application application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "recruit.hire_decision_type")
    private HireDecisionType decision;

    @Column(name = "salary_info", length = 200)
    private String salaryInfo;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "decided_at", nullable = false)
    private OffsetDateTime decidedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected HireDecision() {
    }

    public HireDecision(Application application, HireDecisionType decision,
                        String salaryInfo, LocalDate startDate, String note) {
        this.application = application;
        this.decision = decision;
        this.salaryInfo = salaryInfo;
        this.startDate = startDate;
        this.note = note;
        this.decidedAt = OffsetDateTime.now();
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

    public Long getId() { return id; }
    public Application getApplication() { return application; }
    public HireDecisionType getDecision() { return decision; }
    public String getSalaryInfo() { return salaryInfo; }
    public LocalDate getStartDate() { return startDate; }
    public String getNote() { return note; }
    public OffsetDateTime getDecidedAt() { return decidedAt; }
}
