package com.ecotrack.compliance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AuditRequest {
    @NotNull(message = "Officer ID is required") private Long officerId;
    @NotBlank(message = "Scope is required") private String scope;
    private String findings;
}

