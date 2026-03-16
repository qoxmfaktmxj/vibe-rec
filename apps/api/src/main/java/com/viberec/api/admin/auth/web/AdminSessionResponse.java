package com.viberec.api.admin.auth.web;

import com.viberec.api.admin.auth.domain.AdminRole;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminSessionResponse(
        Long adminAccountId,
        String username,
        String displayName,
        AdminRole role,
        OffsetDateTime authenticatedAt,
        OffsetDateTime expiresAt,
        List<String> permissions
) {
}
