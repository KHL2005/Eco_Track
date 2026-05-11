package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.DocType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Data;

@Data
public class IndustryDocumentRequest {
    @NotBlank(message = "Registration number is required") private String registrationNumber;
    @NotBlank(message = "Industry name is required") private String industryName;
    @NotNull(message = "Doc type is required") private DocType docType;
    @NotBlank(message = "Description is required") private String description;
}
