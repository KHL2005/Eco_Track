package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ImpactStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ImpactResponse {
    private Long impactId;
    private Long projectId;
    private String metricsJson;
    private LocalDate date;
    private ImpactStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

