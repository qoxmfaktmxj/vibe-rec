package com.viberec.api.platform.permission.service;

import com.viberec.api.platform.permission.repository.PermissionRepository;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionRepository permissionRepository;
    private final ConcurrentHashMap<String, List<String>> rolePermissionCache = new ConcurrentHashMap<>();

    public PermissionService(PermissionRepository permissionRepository) {
        this.permissionRepository = permissionRepository;
    }

    public List<String> getPermissionCodes(String role) {
        return rolePermissionCache.computeIfAbsent(role, permissionRepository::findPermissionCodesByRole);
    }

    public boolean hasPermission(String role, String permissionCode) {
        return getPermissionCodes(role).contains(permissionCode);
    }
}
