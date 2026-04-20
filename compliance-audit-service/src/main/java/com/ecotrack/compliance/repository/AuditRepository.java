package com.ecotrack.compliance.repository;

import com.ecotrack.compliance.entity.Audit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditRepository extends JpaRepository<Audit, Long> {
    List<Audit> findByOfficerId(Long officerId);
}

