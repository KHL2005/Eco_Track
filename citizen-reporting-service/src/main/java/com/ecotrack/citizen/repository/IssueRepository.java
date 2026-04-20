package com.ecotrack.citizen.repository;

import com.ecotrack.citizen.entity.Issue;
import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByCitizenId(Long citizenId);
    List<Issue> findByStatus(IssueStatus status);
    List<Issue> findByType(IssueType type);
}

