package com.ecotrack.monitoring.entity;

import com.ecotrack.monitoring.enums.SensorStatus;
import com.ecotrack.monitoring.enums.SensorType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Sensor {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sensor_id") private Long sensorId;
    @Column(nullable = true, length = 500) private String location;
    @Enumerated(EnumType.STRING) @Column(nullable = true) private SensorType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private SensorStatus status = SensorStatus.ACTIVE;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

