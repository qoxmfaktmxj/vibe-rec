package com.viberec.api.admin.auth.web;

import com.viberec.api.admin.auth.domain.AdminRole;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminLoginResponse(
        Long adminAccountId,
        String username,
        String displayName,
        AdminRole role,
        OffsetDateTime authenticatedAt,
        OffsetDateTime expiresAt,
        String sessionToken,
        List<String> permissions
) {
}
