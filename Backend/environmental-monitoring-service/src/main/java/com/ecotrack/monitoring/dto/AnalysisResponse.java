package com.ecotrack.monitoring.dto;

import com.ecotrack.monitoring.enums.AnalysisStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AnalysisResponse {
    private Long analysisId;
    private Long dataId;
    private Long sensorId;
    private Long agencyOfficerId;
    private String findings;
    private LocalDateTime date;
    private AnalysisStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
