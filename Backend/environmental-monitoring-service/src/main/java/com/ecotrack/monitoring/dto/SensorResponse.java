package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.SensorStatus;
import com.ecotrack.monitoring.enums.SensorType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SensorResponse {
    private Long sensorId;
    private String name;
    private String location;
    private SensorType type;
    private SensorStatus status;
    private Double latitude;
    private Double longitude;
    private LocalDateTime installedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

