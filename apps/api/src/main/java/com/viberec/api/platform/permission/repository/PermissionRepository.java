package com.viberec.api.platform.permission.repository;

import com.viberec.api.platform.permission.domain.Permission;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    @Query("SELECT p.code FROM Permission p JOIN RolePermission rp ON p.id = rp.permissionId WHERE rp.role = :role")
    List<String> findPermissionCodesByRole(@Param("role") String role);
}
