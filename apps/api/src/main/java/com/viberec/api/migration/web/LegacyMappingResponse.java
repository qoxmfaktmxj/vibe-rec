package com.viberec.api.migration.web;

import java.time.OffsetDateTime;

public record LegacyMappingResponse(
        Long id,
        String entityType,
        String legacyKey,
        Long newId,
        OffsetDateTime migratedAt,
        String notes
) {
}
