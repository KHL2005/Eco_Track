package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ReportScope;
import com.ecotrack.project.enums.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ReportResponse {
    private Long reportId;
    private ReportScope scope;
    private ReportType reportType;
    private Long projectId;
    private Long issueId;
    private String title;
    private String description;
    private String metrics;
    private LocalDateTime generatedDate;
    private LocalDateTime createdAt;
}

