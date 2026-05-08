package com.ecotrack.monitoring.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_data")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class SensorData {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "data_id") private Long dataId;
    @Column(name = "sensor_id", nullable = false) private Long sensorId;
    @Column(name = "parameters_json", columnDefinition = "TEXT") private String parametersJson;
    @Column(name = "recorded_at") private LocalDateTime recordedAt;
    @Column(nullable = false) private LocalDateTime timestamp;
    @Column(name = "notes", columnDefinition = "TEXT") private String notes;
    @PrePersist protected void onCreate() {
        if (this.timestamp == null) this.timestamp = LocalDateTime.now();
        if (this.recordedAt == null) this.recordedAt = LocalDateTime.now();
    }
}

