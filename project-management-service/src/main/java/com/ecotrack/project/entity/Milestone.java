package com.ecotrack.project.entity;

import com.ecotrack.project.enums.MilestoneStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "milestone")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Milestone {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "milestone_id") private Long milestoneId;
    @Column(name = "project_id", nullable = false) private Long projectId;
    @Column(nullable = false, length = 200) private String title;
    @Column(nullable = false) private LocalDate date;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private MilestoneStatus status = MilestoneStatus.PENDING;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() { this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now(); }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

