package com.ecotrack.industry.repository;

import com.ecotrack.industry.entity.EmissionLog;
import com.ecotrack.industry.enums.EmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmissionLogRepository extends JpaRepository<EmissionLog, Long> {
    List<EmissionLog> findByIndustryId(Long industryId);
    List<EmissionLog> findByStatus(EmissionStatus status);
    List<EmissionLog> findByIndustryIdAndStatus(Long industryId, EmissionStatus status);
    List<EmissionLog> findByType(String type);
}
