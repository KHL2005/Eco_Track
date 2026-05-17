package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.AnalysisStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnalysisRequest {
    @NotNull(message = "Data ID is required")
    private Long dataId;
    private Long agencyOfficerId;
    private String findings;
    private AnalysisStatus status;
}
