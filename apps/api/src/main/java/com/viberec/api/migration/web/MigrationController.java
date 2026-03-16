package com.viberec.api.migration.web;

import com.viberec.api.admin.auth.service.AdminAuthService;
import com.viberec.api.migration.domain.LegacyMapping;
import com.viberec.api.migration.domain.MigrationRun;
import com.viberec.api.migration.service.LegacyMigrationService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/migration")
public class MigrationController {

    private final AdminAuthService adminAuthService;
    private final LegacyMigrationService legacyMigrationService;

    public MigrationController(AdminAuthService adminAuthService, LegacyMigrationService legacyMigrationService) {
        this.adminAuthService = adminAuthService;
        this.legacyMigrationService = legacyMigrationService;
    }

    @GetMapping("/runs")
    public List<MigrationRunResponse> getRuns(@RequestHeader("X-Admin-Session") String sessionToken) {
        adminAuthService.getSession(sessionToken);
        return legacyMigrationService.getRunHistory().stream()
                .map(this::toRunResponse)
                .toList();
    }

    @GetMapping("/mappings")
    public List<LegacyMappingResponse> getMappings(
            @RequestHeader("X-Admin-Session") String sessionToken,
            @RequestParam String entityType
    ) {
        adminAuthService.getSession(sessionToken);
        return legacyMigrationService.getMappings(entityType).stream()
                .map(this::toMappingResponse)
                .toList();
    }

    private MigrationRunResponse toRunResponse(MigrationRun run) {
        return new MigrationRunResponse(
                run.getId(),
                run.getRunName(),
                run.getStatus(),
                run.getTotalCount(),
                run.getSuccessCount(),
                run.getFailCount(),
                run.getStartedAt(),
                run.getCompletedAt()
        );
    }

    private LegacyMappingResponse toMappingResponse(LegacyMapping mapping) {
        return new LegacyMappingResponse(
                mapping.getId(),
                mapping.getEntityType(),
                mapping.getLegacyKey(),
                mapping.getNewId(),
                mapping.getMigratedAt(),
                mapping.getNotes()
        );
    }
}
