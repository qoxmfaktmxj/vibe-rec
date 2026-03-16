package com.viberec.api.recruitment.application.repository;

import com.viberec.api.recruitment.application.domain.Application;
import com.viberec.api.recruitment.application.domain.ApplicationReviewStatus;
import com.viberec.api.recruitment.application.domain.ApplicationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    Optional<Application> findByJobPostingIdAndApplicantEmailIgnoreCase(Long jobPostingId, String applicantEmail);

    @EntityGraph(attributePaths = "jobPosting")
    Optional<Application> findWithJobPostingById(Long id);

    @EntityGraph(attributePaths = "jobPosting")
    @Query("""
            select application
            from Application application
            join application.jobPosting jobPosting
            where (:jobPostingId is null or jobPosting.id = :jobPostingId)
              and (:applicationStatus is null or application.status = :applicationStatus)
              and (:reviewStatus is null or application.reviewStatus = :reviewStatus)
              and (
                    :query is null
                    or lower(application.applicantName) like lower(concat('%', cast(:query as string), '%'))
                    or lower(application.applicantEmail) like lower(concat('%', cast(:query as string), '%'))
                  )
            order by coalesce(application.submittedAt, application.draftSavedAt) desc, application.id desc
            """)
    List<Application> findAdminApplicants(
            @Param("jobPostingId") Long jobPostingId,
            @Param("applicationStatus") ApplicationStatus applicationStatus,
            @Param("reviewStatus") ApplicationReviewStatus reviewStatus,
            @Param("query") String query
    );
}
