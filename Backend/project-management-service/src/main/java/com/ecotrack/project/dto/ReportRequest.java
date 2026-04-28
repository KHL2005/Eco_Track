package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ReportScope;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ReportRequest {
    @NotNull(message = "Scope is required") private ReportScope scope;
    @NotBlank(message = "Metrics are required") private String metrics;
}

