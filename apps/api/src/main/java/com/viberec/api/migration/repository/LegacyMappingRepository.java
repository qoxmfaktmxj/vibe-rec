package com.viberec.api.migration.repository;

import com.viberec.api.migration.domain.LegacyMapping;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LegacyMappingRepository extends JpaRepository<LegacyMapping, Long> {

    Optional<LegacyMapping> findByEntityTypeAndLegacyKey(String entityType, String legacyKey);

    List<LegacyMapping> findByEntityType(String entityType);
}
