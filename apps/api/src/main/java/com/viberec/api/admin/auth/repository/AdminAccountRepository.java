package com.viberec.api.admin.auth.repository;

import com.viberec.api.admin.auth.domain.AdminAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AdminAccountRepository extends JpaRepository<AdminAccount, Long> {

    Optional<AdminAccount> findByUsernameIgnoreCase(String username);

    @Query(
            value = """
                    select *
                    from platform.admin_account
                    where username = :username
                      and active = true
                      and password_hash = crypt(cast(:password as text), password_hash)
                    """,
            nativeQuery = true
    )
    Optional<AdminAccount> authenticate(@Param("username") String username, @Param("password") String password);

    @Modifying
    @Query(
            value = """
                    insert into platform.admin_account (
                        username,
                        display_name,
                        password_hash,
                        role,
                        active,
                        created_at,
                        updated_at
                    )
                    values (
                        :username,
                        :displayName,
                        crypt(cast(:password as text), gen_salt('bf')),
                        cast(:role as varchar),
                        true,
                        current_timestamp,
                        current_timestamp
                    )
                    on conflict (username) do update
                    set display_name = excluded.display_name,
                        password_hash = crypt(cast(:password as text), gen_salt('bf')),
                        role = cast(:role as varchar),
                        active = true,
                        updated_at = current_timestamp
                    """,
            nativeQuery = true
    )
    void upsertDevAccount(
            @Param("username") String username,
            @Param("displayName") String displayName,
            @Param("password") String password,
            @Param("role") String role
    );

    @Modifying
    @Query(
            value = """
                    update platform.admin_account
                    set last_authenticated_at = current_timestamp,
                        updated_at = current_timestamp
                    where id = :id
                    """,
            nativeQuery = true
    )
    void markAuthenticated(@Param("id") Long id);
}
