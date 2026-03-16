package com.viberec.api.migration.web;

import java.time.OffsetDateTime;

public record MigrationRunResponse(
        Long id,
        String runName,
        String status,
        Integer totalCount,
        Integer successCount,
        Integer failCount,
        OffsetDateTime startedAt,
        OffsetDateTime completedAt
) {
}
