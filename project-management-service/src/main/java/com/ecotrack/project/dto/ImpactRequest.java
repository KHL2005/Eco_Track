package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ImpactStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ImpactRequest {

    @NotNull(message = "Metrics object is required")
    @Valid
    private ImpactMetrics metrics;

    private ImpactStatus status;
}
