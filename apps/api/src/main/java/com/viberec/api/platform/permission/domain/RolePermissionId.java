package com.viberec.api.platform.permission.domain;

import java.io.Serializable;
import java.util.Objects;

public class RolePermissionId implements Serializable {

    private String role;
    private Long permissionId;

    protected RolePermissionId() {
    }

    public RolePermissionId(String role, Long permissionId) {
        this.role = role;
        this.permissionId = permissionId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RolePermissionId that)) return false;
        return Objects.equals(role, that.role) && Objects.equals(permissionId, that.permissionId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(role, permissionId);
    }
}
