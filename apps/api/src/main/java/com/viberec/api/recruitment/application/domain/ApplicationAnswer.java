package com.viberec.api.recruitment.application.domain;

import com.viberec.api.recruitment.jobposting.domain.JobPostingQuestion;
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
@Table(name = "application_answer", schema = "recruit")
public class ApplicationAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "job_posting_question_id", nullable = false)
    private JobPostingQuestion jobPostingQuestion;

    @Column(name = "answer_text", columnDefinition = "text")
    private String answerText;

    @Column(name = "answer_choice", length = 200)
    private String answerChoice;

    @Column(name = "answer_scale")
    private Short answerScale;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    protected ApplicationAnswer() {}

    public ApplicationAnswer(Application application, JobPostingQuestion jobPostingQuestion,
                             String answerText, String answerChoice, Short answerScale) {
        this.application = application;
        this.jobPostingQuestion = jobPostingQuestion;
        this.answerText = answerText;
        this.answerChoice = answerChoice;
        this.answerScale = answerScale;
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
    public JobPostingQuestion getJobPostingQuestion() { return jobPostingQuestion; }
    public String getAnswerText() { return answerText; }
    public String getAnswerChoice() { return answerChoice; }
    public Short getAnswerScale() { return answerScale; }

    public void update(String answerText, String answerChoice, Short answerScale) {
        this.answerText = answerText;
        this.answerChoice = answerChoice;
        this.answerScale = answerScale;
    }
}
