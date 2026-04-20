package com.ecotrack.monitoring.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SensorDataRequest {
    @NotNull(message = "Sensor ID is required") private Long sensorId;
    @NotBlank(message = "Parameters JSON is required") private String parametersJson;
}

