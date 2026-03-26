package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobPostingIdAndCandidateAccountId(Long jobPostingId, Long candidateAccountId);

    Optional<Application> findByIdAndCandidateAccountId(Long id, Long candidateAccountId);

    @Query("""
            select application
            from Application application
            join fetch application.jobPosting jobPosting
            where application.id = :applicationId
            """)
    Optional<Application> findWithJobPostingById(@Param("applicationId") Long applicationId);

    @Query("""
            select application
            from Application application
            join fetch application.jobPosting
            """)
    List<Application> findAllWithJobPosting();

    @Query("""
            select application
            from Application application
            join fetch application.jobPosting jobPosting
            where (:jobPostingId is null or jobPosting.id = :jobPostingId)
              and (:applicationStatus is null or application.status = :applicationStatus)
              and (:reviewStatus is null or application.reviewStatus = :reviewStatus)
              and (:applicantName = '' or lower(application.applicantName) like concat('%', :applicantName, '%'))
              and (:applicantEmail = '' or lower(application.applicantEmail) like concat('%', :applicantEmail, '%'))
              and (:applicantPhone = '' or lower(application.applicantPhone) like concat('%', :applicantPhone, '%'))
              and (
                    :query = ''
                    or lower(application.applicantName) like concat('%', :query, '%')
                    or lower(application.applicantEmail) like concat('%', :query, '%')
                    or lower(application.applicantPhone) like concat('%', :query, '%')
                    or lower(jobPosting.title) like concat('%', :query, '%')
              )
            order by coalesce(application.submittedAt, application.draftSavedAt) desc, application.id desc
            """)
    List<Application> findAdminApplicants(
            @Param("jobPostingId") Long jobPostingId,
            @Param("applicationStatus") ApplicationStatus applicationStatus,
            @Param("reviewStatus") ApplicationReviewStatus reviewStatus,
            @Param("applicantName") String applicantName,
            @Param("applicantEmail") String applicantEmail,
            @Param("applicantPhone") String applicantPhone,
            @Param("query") String query
    );
}
