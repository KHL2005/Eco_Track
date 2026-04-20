package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.ResolutionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ResolutionResponse {
    private Long resolutionId;
    private Long issueId;
    private Long officerId;
    private String actions;
    private LocalDateTime date;
    private ResolutionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
