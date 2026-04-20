package com.ecotrack.project.repository;

import com.ecotrack.project.entity.Impact;
import com.ecotrack.project.enums.ImpactStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ImpactRepository extends JpaRepository<Impact, Long> {
    Optional<Impact> findByProjectId(Long projectId);
    List<Impact> findByStatus(ImpactStatus status);
    void deleteByProjectId(Long projectId);
}
