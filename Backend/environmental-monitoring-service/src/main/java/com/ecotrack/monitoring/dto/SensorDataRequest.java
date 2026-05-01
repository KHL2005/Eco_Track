package com.ecotrack.monitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SensorDataRequest {
    @NotNull(message = "Sensor ID is required") private Long sensorId;
    private Double value;
    private String unit;
    private String parametersJson;
    private LocalDateTime recordedAt;
    private String notes;
}

