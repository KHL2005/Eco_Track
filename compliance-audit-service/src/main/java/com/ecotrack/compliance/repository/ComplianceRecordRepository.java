package com.ecotrack.compliance.repository;

import com.ecotrack.compliance.entity.ComplianceRecord;
import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComplianceRecordRepository extends JpaRepository<ComplianceRecord, Long> {
    List<ComplianceRecord> findByEntityId(Long entityId);
    List<ComplianceRecord> findByType(ComplianceType type);
    List<ComplianceRecord> findByResult(ComplianceResult result);
}

