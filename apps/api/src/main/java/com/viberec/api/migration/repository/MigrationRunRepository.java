package com.viberec.api.migration.repository;

import com.viberec.api.migration.domain.MigrationRun;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MigrationRunRepository extends JpaRepository<MigrationRun, Long> {

    List<MigrationRun> findAllByOrderByStartedAtDesc();
}
