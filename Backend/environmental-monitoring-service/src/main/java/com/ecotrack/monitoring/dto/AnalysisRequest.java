package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.AnalysisStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnalysisRequest {
    @NotNull(message = "Data ID is required")
    private Long dataId;

    // agencyOfficerId is auto-assigned from the JWT token (X-User-Id header) when reviewed by agency officers.
    // Do NOT pass this manually — it will be ignored.
    private Long agencyOfficerId;

    // findings are optional — auto-generated from sensor parameters if not provided
    private String findings;

    private AnalysisStatus status;
}
