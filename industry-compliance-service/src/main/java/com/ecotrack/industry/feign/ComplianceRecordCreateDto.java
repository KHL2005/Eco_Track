package com.ecotrack.industry.feign;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Mirror DTO matching com.ecotrack.compliance.dto.ComplianceRecordRequest
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ComplianceRecordCreateDto {
    @NotNull private Long entityId;
    @NotNull private String type;   // ComplianceType enum value as String
    @NotNull private String result; // ComplianceResult enum value as String
    private String notes;
}

