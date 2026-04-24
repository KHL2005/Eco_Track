package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.DocType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IndustryDocumentRequest {
    @NotNull(message = "Industry ID is required") private Long industryId;
    @NotBlank(message = "Industry name is required") private String industryName;
    @NotNull(message = "Doc type is required") private DocType docType;
    @NotBlank(message = "File URI is required") private String fileUri;
    private String description;
}

