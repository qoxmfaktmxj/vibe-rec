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
@Table(name = "candidate_profile_language", schema = "platform")
public class CandidateProfileLanguage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_account_id", nullable = false)
    private Long candidateAccountId;

    @Column(name = "language_name", nullable = false, length = 60)
    private String languageName;

    @Column(length = 30)
    private String proficiency;

    @Column(name = "test_name", length = 100)
    private String testName;

    @Column(name = "test_score", length = 40)
    private String testScore;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected CandidateProfileLanguage() {}

    public CandidateProfileLanguage(Long candidateAccountId, String languageName, String proficiency,
                                    String testName, String testScore, int sortOrder) {
        this.candidateAccountId = candidateAccountId;
        this.languageName = languageName;
        this.proficiency = proficiency;
        this.testName = testName;
        this.testScore = testScore;
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
    public String getLanguageName() { return languageName; }
    public String getProficiency() { return proficiency; }
    public String getTestName() { return testName; }
    public String getTestScore() { return testScore; }
    public int getSortOrder() { return sortOrder; }

    public void update(String languageName, String proficiency, String testName,
                       String testScore, int sortOrder) {
        this.languageName = languageName;
        this.proficiency = proficiency;
        this.testName = testName;
        this.testScore = testScore;
        this.sortOrder = sortOrder;
    }
}
