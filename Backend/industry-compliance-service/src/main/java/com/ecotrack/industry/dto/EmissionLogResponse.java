package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.EmissionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class EmissionLogResponse {
    private Long logId;
    private Long industryId;
    private String registrationNumber;
    private String industryName;
    private EmissionType type;
    private BigDecimal quantity;
    private String description;
    private LocalDateTime date;
    private EmissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

