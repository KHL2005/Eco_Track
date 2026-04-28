package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ReportScope;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ReportResponse {
    private Long reportId;
    private ReportScope scope;
    private String metrics;
    private LocalDateTime generatedDate;
    private LocalDateTime createdAt;
}

