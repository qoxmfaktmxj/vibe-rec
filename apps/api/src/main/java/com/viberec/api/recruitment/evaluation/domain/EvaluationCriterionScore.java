package com.viberec.api.recruitment.evaluation.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "evaluation_criterion_score", schema = "recruit")
public class EvaluationCriterionScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "criterion_id", nullable = false)
    private ScorecardCriterion criterion;

    @Column(nullable = false)
    private short score;

    @Column(length = 1000)
    private String comment;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    protected EvaluationCriterionScore() {
    }

    public EvaluationCriterionScore(
            Evaluation evaluation,
            ScorecardCriterion criterion,
            short score,
            String comment
    ) {
        this.evaluation = evaluation;
        this.criterion = criterion;
        this.score = score;
        this.comment = comment;
    }

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Long getId() { return id; }
    public Evaluation getEvaluation() { return evaluation; }
    public ScorecardCriterion getCriterion() { return criterion; }
    public short getScore() { return score; }
    public String getComment() { return comment; }
}
