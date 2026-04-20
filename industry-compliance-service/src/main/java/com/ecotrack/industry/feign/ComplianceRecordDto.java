package com.ecotrack.industry.feign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Mirror DTO matching com.ecotrack.compliance.dto.ComplianceRecordResponse
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ComplianceRecordDto {
    private Long complianceId;
    private Long entityId;
    private String type;
    private String result;
    private LocalDateTime date;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

