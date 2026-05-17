package com.ecotrack.monitoring.entity;

import com.ecotrack.monitoring.enums.AnalysisStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "analysis")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Analysis {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "analysis_id") private Long analysisId;

    @Column(name = "data_id", nullable = false) private Long dataId;

    @Column(name = "sensor_id") private Long sensorId;

    @Column(name = "agency_officer_id") private Long agencyOfficerId;

    @Column(nullable = false, columnDefinition = "TEXT") private String findings;

    @Column(nullable = false) private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false) @Builder.Default
    private AnalysisStatus status = AnalysisStatus.PENDING;

    @Column(name = "created_at") private LocalDateTime createdAt;

    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
