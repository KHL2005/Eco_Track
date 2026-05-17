package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ReportScope;
import com.ecotrack.project.enums.ReportType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "Scope is required") private ReportScope scope;
    private ReportType reportType;
    private Long projectId;
    private Long issueId;
    private String title;
    private String description;
    private String metrics;
}

