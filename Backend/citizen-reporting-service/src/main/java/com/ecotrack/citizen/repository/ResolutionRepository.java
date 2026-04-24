package com.ecotrack.citizen.repository;

import com.ecotrack.citizen.entity.Resolution;
import com.ecotrack.citizen.enums.ResolutionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ResolutionRepository extends JpaRepository<Resolution, Long> {
    Optional<Resolution> findByIssueId(Long issueId);
    boolean existsByIssueId(Long issueId);
    List<Resolution> findByOfficerId(Long officerId);
    List<Resolution> findByStatus(ResolutionStatus status);
}
