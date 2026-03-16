package com.viberec.api.platform.permission.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "role_permission", schema = "platform")
@IdClass(RolePermissionId.class)
public class RolePermission {

    @Id
    @Column(nullable = false, length = 40)
    private String role;

    @Id
    @Column(name = "permission_id", nullable = false)
    private Long permissionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "permission_id", insertable = false, updatable = false)
    private Permission permission;

    protected RolePermission() {
    }

    public RolePermission(String role, Long permissionId) {
        this.role = role;
        this.permissionId = permissionId;
    }

    public String getRole() {
        return role;
    }

    public Long getPermissionId() {
        return permissionId;
    }

    public Permission getPermission() {
        return permission;
    }
}
