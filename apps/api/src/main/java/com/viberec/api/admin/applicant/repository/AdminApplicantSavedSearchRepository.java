package com.viberec.api.admin.applicant.repository;

import com.viberec.api.admin.applicant.domain.AdminApplicantSavedSearch;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminApplicantSavedSearchRepository extends JpaRepository<AdminApplicantSavedSearch, Long> {

    List<AdminApplicantSavedSearch> findAllByAdminAccountIdOrderByCreatedAtDesc(Long adminAccountId);

    Optional<AdminApplicantSavedSearch> findByIdAndAdminAccountId(Long id, Long adminAccountId);

    @Modifying
    @Query(value = """
            insert into platform.admin_applicant_saved_search (
                admin_account_id, name, normalized_name, filters, created_at, updated_at
            ) values (
                :adminAccountId, :name, :normalizedName, cast(:filtersJson as jsonb), current_timestamp, current_timestamp
            )
            on conflict (admin_account_id, normalized_name) do nothing
            """, nativeQuery = true)
    int createIfAbsent(
            @Param("adminAccountId") Long adminAccountId,
            @Param("name") String name,
            @Param("normalizedName") String normalizedName,
            @Param("filtersJson") String filtersJson
    );

    @Modifying
    @Query("""
            delete from AdminApplicantSavedSearch savedSearch
            where savedSearch.id = :id
              and savedSearch.adminAccount.id = :adminAccountId
            """)
    int deleteOwned(@Param("id") Long id, @Param("adminAccountId") Long adminAccountId);
}
