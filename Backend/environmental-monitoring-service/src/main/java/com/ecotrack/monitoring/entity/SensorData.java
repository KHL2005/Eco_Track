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
    @Column(name = "parameters_json", nullable = false, columnDefinition = "TEXT") private String parametersJson;
    @Column(nullable = false) private LocalDateTime timestamp;
    @PrePersist protected void onCreate() { if (this.timestamp == null) this.timestamp = LocalDateTime.now(); }
}

