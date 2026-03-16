package com.viberec.api.migration.service;

import com.viberec.api.migration.domain.LegacyMapping;
import com.viberec.api.migration.domain.MigrationRun;
import com.viberec.api.migration.repository.LegacyMappingRepository;
import com.viberec.api.migration.repository.MigrationRunRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LegacyMigrationService {

    private final LegacyMappingRepository legacyMappingRepository;
    private final MigrationRunRepository migrationRunRepository;

    public LegacyMigrationService(
            LegacyMappingRepository legacyMappingRepository,
            MigrationRunRepository migrationRunRepository
    ) {
        this.legacyMappingRepository = legacyMappingRepository;
        this.migrationRunRepository = migrationRunRepository;
    }

    @Transactional
    public MigrationRun startRun(String runName, int totalCount) {
        return migrationRunRepository.save(new MigrationRun(runName, totalCount));
    }

    @Transactional
    public void recordMapping(String entityType, String legacyKey, Long newId, String notes) {
        legacyMappingRepository.save(new LegacyMapping(entityType, legacyKey, newId, notes));
    }

    public List<MigrationRun> getRunHistory() {
        return migrationRunRepository.findAllByOrderByStartedAtDesc();
    }

    public List<LegacyMapping> getMappings(String entityType) {
        return legacyMappingRepository.findByEntityType(entityType);
    }
}
