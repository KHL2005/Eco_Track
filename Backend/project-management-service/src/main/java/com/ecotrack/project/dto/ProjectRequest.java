package com.ecotrack.project.dto;

import com.ecotrack.project.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ProjectRequest {
    @NotBlank(message = "Title is required") private String title;
    private String description;
    @NotNull(message = "Start date is required") private LocalDate startDate;
    private LocalDate endDate;
    private BigDecimal budget;
    private ProjectStatus status;
}

