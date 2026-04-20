package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ImpactStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ImpactRequest {
    @NotBlank(message = "Metrics JSON is required")
    private String metricsJson;

    private ImpactStatus status;
}
