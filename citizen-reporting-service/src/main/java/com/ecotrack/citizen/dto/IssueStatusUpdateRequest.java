package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.IssueStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueStatusUpdateRequest {
    @NotNull(message = "Status is required")
    private IssueStatus status;
}

