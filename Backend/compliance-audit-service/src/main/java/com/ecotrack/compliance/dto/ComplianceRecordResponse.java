package com.ecotrack.compliance.dto;

import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class ComplianceRecordResponse {
    private Long complianceId;
    private Long entityId;
    private ComplianceType type;
    private ComplianceResult result;
    private LocalDateTime date;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

