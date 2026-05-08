package com.ecotrack.monitoring.repository;

import com.ecotrack.monitoring.entity.Analysis;
import com.ecotrack.monitoring.enums.AnalysisStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface AnalysisRepository extends JpaRepository<Analysis, Long> {
    Optional<Analysis> findByDataId(Long dataId);
    List<Analysis> findAllByDataId(Long dataId);
    List<Analysis> findByScientistId(Long scientistId);
    List<Analysis> findByStatus(AnalysisStatus status);

    // FIXED: Use direct sensorId field instead of trying to join dataId
    @Query("SELECT a FROM Analysis a WHERE a.sensorId = :sensorId")
    List<Analysis> findBySensorId(@Param("sensorId") Long sensorId);
}
