package com.viberec.api.candidate.profile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_profile_skill", schema = "platform")
public class CandidateProfileSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_account_id", nullable = false)
    private Long candidateAccountId;

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

    protected CandidateProfileSkill() {}

    public CandidateProfileSkill(Long candidateAccountId, String skillName, String proficiency,
                                 Integer years, int sortOrder) {
        this.candidateAccountId = candidateAccountId;
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
    public Long getCandidateAccountId() { return candidateAccountId; }
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
