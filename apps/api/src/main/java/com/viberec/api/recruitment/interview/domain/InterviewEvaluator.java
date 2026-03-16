package com.viberec.api.recruitment.interview.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "interview_evaluator", schema = "recruit")
public class InterviewEvaluator {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "evaluator_name", nullable = false, length = 120)
    private String evaluatorName;

    @Column
    private Short score;

    @Column(columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "recruit.interview_result")
    private InterviewResult result;

    @Column(name = "evaluated_at")
    private OffsetDateTime evaluatedAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected InterviewEvaluator() {
    }

    public InterviewEvaluator(Interview interview, String evaluatorName) {
        this.interview = interview;
        this.evaluatorName = evaluatorName;
        this.result = InterviewResult.PENDING;
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

    public void submitScore(Short score, String comment, InterviewResult result) {
        this.score = score;
        this.comment = comment;
        this.result = result;
        this.evaluatedAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Interview getInterview() { return interview; }
    public String getEvaluatorName() { return evaluatorName; }
    public Short getScore() { return score; }
    public String getComment() { return comment; }
    public InterviewResult getResult() { return result; }
    public OffsetDateTime getEvaluatedAt() { return evaluatedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
