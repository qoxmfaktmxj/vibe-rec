package com.viberec.api.recruitment.application.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "application_career", schema = "recruit")
public class ApplicationCareer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(length = 200)
    private String position;

    @Column(name = "started_at", nullable = false)
    private LocalDate startedAt;

    @Column(name = "ended_at")
    private LocalDate endedAt;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    protected ApplicationCareer() {
    }

    public ApplicationCareer(Application application, String companyName, String position, LocalDate startedAt, LocalDate endedAt, String description, short sortOrder) {
        this.application = application;
        this.companyName = companyName;
        this.position = position;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.description = description;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public String getCompanyName() {
        return companyName;
    }

    public String getPosition() {
        return position;
    }

    public LocalDate getStartedAt() {
        return startedAt;
    }

    public LocalDate getEndedAt() {
        return endedAt;
    }

    public String getDescription() {
        return description;
    }

    public short getSortOrder() {
        return sortOrder;
    }
}
