package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueRequest {
    @NotNull(message = "Citizen ID is required")
    private Long citizenId;
    @NotNull(message = "Issue type is required")
    private IssueType type;
    @NotBlank(message = "Location is required")
    private String location;
    private String description;
}

