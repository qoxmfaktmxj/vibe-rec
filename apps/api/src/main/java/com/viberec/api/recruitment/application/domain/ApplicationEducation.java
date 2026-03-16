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
@Table(name = "application_education", schema = "recruit")
public class ApplicationEducation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "school_name", nullable = false, length = 200)
    private String schoolName;

    @Column(length = 200)
    private String major;

    @Column(length = 40)
    private String degree;

    @Column(name = "graduated_at")
    private LocalDate graduatedAt;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    protected ApplicationEducation() {
    }

    public ApplicationEducation(Application application, String schoolName, String major, String degree, LocalDate graduatedAt, short sortOrder) {
        this.application = application;
        this.schoolName = schoolName;
        this.major = major;
        this.degree = degree;
        this.graduatedAt = graduatedAt;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public Application getApplication() {
        return application;
    }

    public String getSchoolName() {
        return schoolName;
    }

    public String getMajor() {
        return major;
    }

    public String getDegree() {
        return degree;
    }

    public LocalDate getGraduatedAt() {
        return graduatedAt;
    }

    public short getSortOrder() {
        return sortOrder;
    }
}
