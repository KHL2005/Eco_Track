package com.ecotrack.project.repository;

import com.ecotrack.project.entity.Report;
import com.ecotrack.project.enums.ReportScope;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByScope(ReportScope scope);
}

