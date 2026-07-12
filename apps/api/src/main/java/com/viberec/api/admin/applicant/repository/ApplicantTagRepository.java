package com.viberec.api.admin.applicant.repository;

import com.viberec.api.admin.applicant.domain.ApplicantTag;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicantTagRepository extends JpaRepository<ApplicantTag, Long> {

    Optional<ApplicantTag> findByNormalizedName(String normalizedName);

    List<ApplicantTag> findAllByOrderByNameAsc();

    @Modifying
    @Query(value = """
            insert into recruit.applicant_tag (name, normalized_name, created_by, created_at)
            values (:name, :normalizedName, :createdBy, current_timestamp)
            on conflict (normalized_name) do nothing
            """, nativeQuery = true)
    void createIfAbsent(
            @Param("name") String name,
            @Param("normalizedName") String normalizedName,
            @Param("createdBy") Long createdBy
    );
}
