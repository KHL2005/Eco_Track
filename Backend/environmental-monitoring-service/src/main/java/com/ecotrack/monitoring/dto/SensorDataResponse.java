package com.ecotrack.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SensorDataResponse {
    private Long id;
    private Long dataId;
    private Long sensorId;
    private Double value;
    private String unit;
    private String parametersJson;
    private LocalDateTime recordedAt;
    private LocalDateTime timestamp;
    private String notes;
}

