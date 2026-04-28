package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.ResolutionStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResolutionStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private ResolutionStatus status;

    private String actions;
}

