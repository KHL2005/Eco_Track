package com.ecotrack.industry.repository;

import com.ecotrack.industry.entity.EmissionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface EmissionLogRepository extends JpaRepository<EmissionLog, Long> {
    List<EmissionLog> findByIndustryId(Long industryId);
    List<EmissionLog> findByIndustryName(String industryName);
    boolean existsByIndustryNameAndType(String industryName, String type);
}
