package com.ecotrack.project.dto;

import com.ecotrack.project.enums.MilestoneStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class MilestoneResponse {
    private Long milestoneId;
    private Long projectId;
    private String title;
    private String description;
    private LocalDate date;
    private MilestoneStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
