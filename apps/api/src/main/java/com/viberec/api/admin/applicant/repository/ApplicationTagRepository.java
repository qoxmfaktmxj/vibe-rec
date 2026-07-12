package com.viberec.api.admin.applicant.repository;

import com.viberec.api.admin.applicant.domain.ApplicationTag;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ApplicationTagRepository extends JpaRepository<ApplicationTag, Long> {

    @Query("""
            select applicationTag
            from ApplicationTag applicationTag
            join fetch applicationTag.tag
            where applicationTag.application.id in :applicationIds
            order by applicationTag.tag.name asc
            """)
    List<ApplicationTag> findAllForApplications(@Param("applicationIds") Collection<Long> applicationIds);

    boolean existsByApplicationIdAndTagId(Long applicationId, Long tagId);

    @Modifying
    @Query("""
            delete from ApplicationTag applicationTag
            where applicationTag.application.id = :applicationId
              and applicationTag.tag.id = :tagId
            """)
    int deleteLink(@Param("applicationId") Long applicationId, @Param("tagId") Long tagId);
}
