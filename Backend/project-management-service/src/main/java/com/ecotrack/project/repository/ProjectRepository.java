package com.ecotrack.project.repository;

import com.ecotrack.project.entity.Project;
import com.ecotrack.project.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByStatus(ProjectStatus status);
}

