package com.viberec.api.candidate.auth.repository;

import com.viberec.api.candidate.auth.domain.CandidateAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CandidateAccountRepository extends JpaRepository<CandidateAccount, Long> {

    Optional<CandidateAccount> findByNormalizedEmail(String normalizedEmail);

    @Query(
            value = """
                    select *
                    from platform.candidate_account
                    where normalized_email = :normalizedEmail
                      and status = 'ACTIVE'
                      and password_hash = crypt(cast(:password as text), password_hash)
                    """,
            nativeQuery = true
    )
    Optional<CandidateAccount> authenticate(
            @Param("normalizedEmail") String normalizedEmail,
            @Param("password") String password
    );

    @Modifying
    @Query(
            value = """
                    insert into platform.candidate_account (
                        email,
                        normalized_email,
                        display_name,
                        phone_number,
                        password_hash,
                        status,
                        created_at,
                        updated_at
                    ) values (
                        :email,
                        :normalizedEmail,
                        :displayName,
                        :phoneNumber,
                        crypt(cast(:password as text), gen_salt('bf')),
                        'ACTIVE',
                        current_timestamp,
                        current_timestamp
                    )
                    """,
            nativeQuery = true
    )
    void createAccount(
            @Param("email") String email,
            @Param("normalizedEmail") String normalizedEmail,
            @Param("displayName") String displayName,
            @Param("phoneNumber") String phoneNumber,
            @Param("password") String password
    );

    @Modifying
    @Query(
            value = """
                    update platform.candidate_account
                    set last_authenticated_at = current_timestamp,
                        updated_at = current_timestamp
                    where id = :id
                    """,
            nativeQuery = true
    )
    void markAuthenticated(@Param("id") Long id);
}