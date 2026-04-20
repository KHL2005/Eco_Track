package com.ecotrack.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class SensorDataResponse {
    private Long dataId;
    private Long sensorId;
    private String parametersJson;
    private LocalDateTime timestamp;
}

