package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.AnalysisStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnalysisRequest {
    @NotNull(message = "Data ID is required")
    private Long dataId;

    @NotNull(message = "Scientist ID is required")
    private Long scientistId;

    @NotBlank(message = "Findings are required")
    private String findings;

    private AnalysisStatus status;
}

