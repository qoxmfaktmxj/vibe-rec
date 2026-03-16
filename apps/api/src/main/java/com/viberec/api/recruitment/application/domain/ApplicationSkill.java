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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "application_skill", schema = "recruit")
public class ApplicationSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;

    @Column(length = 30)
    private String proficiency;

    private Integer years;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ApplicationSkill() {
    }

    public ApplicationSkill(Application application, String skillName, String proficiency,
                            Integer years, int sortOrder) {
        this.application = application;
        this.skillName = skillName;
        this.proficiency = proficiency;
        this.years = years;
        this.sortOrder = sortOrder;
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
    public String getSkillName() { return skillName; }
    public String getProficiency() { return proficiency; }
    public Integer getYears() { return years; }
    public int getSortOrder() { return sortOrder; }

    public void update(String skillName, String proficiency, Integer years, int sortOrder) {
        this.skillName = skillName;
        this.proficiency = proficiency;
        this.years = years;
        this.sortOrder = sortOrder;
    }
}
