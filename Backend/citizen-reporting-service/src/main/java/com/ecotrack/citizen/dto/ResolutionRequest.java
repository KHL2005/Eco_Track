package com.ecotrack.citizen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolutionRequest {
    @NotNull(message = "Officer ID is required")
    private Long officerId;
    @NotBlank(message = "Actions are required")
    private String actions;
}
