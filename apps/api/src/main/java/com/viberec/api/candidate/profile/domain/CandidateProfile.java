package com.viberec.api.candidate.profile.domain;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import jakarta.persistence.*;
import java.time.OffsetDateTime;

@Entity
@Table(name = "candidate_profile", schema = "platform")
public class CandidateProfile {

    @Id
    @Column(name = "candidate_account_id")
    private Long candidateAccountId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "candidate_account_id")
    private CandidateAccount candidateAccount;

    @Column(name = "introduction_template", columnDefinition = "text")
    private String introductionTemplate;

    @Column(name = "core_strength_template", columnDefinition = "text")
    private String coreStrengthTemplate;

    @Column(name = "career_years")
    private Integer careerYears;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateProfile() {}

    public CandidateProfile(CandidateAccount candidateAccount) {
        this.candidateAccount = candidateAccount;
        this.candidateAccountId = candidateAccount.getId();
    }

    @PrePersist
    void onCreate() { updatedAt = OffsetDateTime.now(); }

    @PreUpdate
    void onUpdate() { updatedAt = OffsetDateTime.now(); }

    public Long getCandidateAccountId() { return candidateAccountId; }
    public CandidateAccount getCandidateAccount() { return candidateAccount; }
    public String getIntroductionTemplate() { return introductionTemplate; }
    public String getCoreStrengthTemplate() { return coreStrengthTemplate; }
    public Integer getCareerYears() { return careerYears; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }

    public void update(String introductionTemplate, String coreStrengthTemplate, Integer careerYears) {
        this.introductionTemplate = introductionTemplate;
        this.coreStrengthTemplate = coreStrengthTemplate;
        this.careerYears = careerYears;
    }
}
