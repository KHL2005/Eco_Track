package com.ecotrack.monitoring.repository;

import com.ecotrack.monitoring.entity.Analysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    Optional<Analysis> findByDataId(Long dataId);
    List<Analysis> findAllByDataId(Long dataId);
    List<Analysis> findByScientistId(Long scientistId);
}
