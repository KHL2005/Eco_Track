package com.ecotrack.compliance.dto;

import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ComplianceRecordRequest {
    @NotNull(message = "Entity ID is required") private Long entityId;
    @NotNull(message = "Type is required") private ComplianceType type;
    @NotNull(message = "Result is required") private ComplianceResult result;
    private String notes;
}

