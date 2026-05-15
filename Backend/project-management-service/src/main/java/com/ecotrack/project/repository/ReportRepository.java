package com.ecotrack.project.repository;

import com.ecotrack.project.entity.Report;
import com.ecotrack.project.enums.ReportScope;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findByScope(ReportScope scope);
    List<Report> findByProjectId(Long projectId);
    List<Report> findByIssueId(Long issueId);
    Optional<Report> findByProjectIdAndScope(Long projectId, ReportScope scope);
    Optional<Report> findByIssueIdAndScope(Long issueId, ReportScope scope);
}

