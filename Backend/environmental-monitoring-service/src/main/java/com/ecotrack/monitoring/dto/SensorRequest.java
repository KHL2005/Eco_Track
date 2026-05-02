package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.SensorType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SensorRequest {
    @NotBlank(message = "Name is required") private String name;
    @NotBlank(message = "Location is required") private String location;
    @NotNull(message = "Type is required") private SensorType type;
    private Double latitude;
    private Double longitude;
    private LocalDateTime installedAt;
}

