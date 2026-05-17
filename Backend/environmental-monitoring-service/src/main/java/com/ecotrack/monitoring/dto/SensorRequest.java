package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.SensorType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SensorRequest {
    @NotBlank(message = "Location is required")
    @Size(min = 2, max = 500, message = "Location must be between 2 and 500 characters")
    private String location;
    
    @NotNull(message = "Sensor type is required") 
    private SensorType type;
}

