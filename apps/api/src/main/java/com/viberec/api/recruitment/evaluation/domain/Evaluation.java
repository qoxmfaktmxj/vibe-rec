package com.viberec.api.recruitment.evaluation.domain;

import com.viberec.api.recruitment.interview.domain.Interview;
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
@Table(name = "evaluation", schema = "recruit")
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_id", nullable = false)
    private Interview interview;

    @Column(name = "evaluator_id", nullable = false)
    private Long evaluatorId;

    @Column
    private Short score;

    @Column(columnDefinition = "text")
    private String comment;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private EvaluationResult result;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected Evaluation() {
    }

    public Evaluation(Interview interview, Long evaluatorId, Short score, String comment, EvaluationResult result) {
        this.interview = interview;
        this.evaluatorId = evaluatorId;
        this.score = score;
        this.comment = comment;
        this.result = result;
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

    public Long getId() {
        return id;
    }

    public Interview getInterview() {
        return interview;
    }

    public Long getEvaluatorId() {
        return evaluatorId;
    }

    public Short getScore() {
        return score;
    }

    public String getComment() {
        return comment;
    }

    public EvaluationResult getResult() {
        return result;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }
}
