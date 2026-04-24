package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.EmissionStatus;
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
    private String industryName;
    private String type;
    private BigDecimal quantity;
    private LocalDateTime date;
    private EmissionStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

