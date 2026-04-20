package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.SensorType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SensorRequest {
    @NotBlank(message = "Location is required") private String location;
    @NotNull(message = "Type is required") private SensorType type;
}

