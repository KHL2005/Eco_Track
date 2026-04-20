package com.ecotrack.project.repository;

import com.ecotrack.project.entity.Milestone;
import com.ecotrack.project.enums.MilestoneStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectId(Long projectId);
    List<Milestone> findByStatus(MilestoneStatus status);
    void deleteAllByProjectId(Long projectId);
}
