package com.viberec.api.admin.auth.web;

import com.viberec.api.admin.auth.domain.AdminRole;
import java.time.OffsetDateTime;

public record AdminSessionResponse(
        Long adminAccountId,
        String username,
        String displayName,
        AdminRole role,
        OffsetDateTime authenticatedAt,
        OffsetDateTime expiresAt
) {
}
