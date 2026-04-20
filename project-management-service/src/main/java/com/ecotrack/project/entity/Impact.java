package com.ecotrack.project.entity;

import com.ecotrack.project.enums.ImpactStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity @Table(name = "impact")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Impact {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "impact_id") private Long impactId;
    @Column(name = "project_id", nullable = false, unique = true) private Long projectId;
    @Column(name = "metrics_json", nullable = false, columnDefinition = "TEXT") private String metricsJson;
    @Column(nullable = false) private LocalDate date;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private ImpactStatus status = ImpactStatus.DRAFT;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDate.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

