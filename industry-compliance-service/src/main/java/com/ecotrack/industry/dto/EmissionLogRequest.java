package com.ecotrack.industry.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmissionLogRequest {
    @NotNull(message = "Industry ID is required") private Long industryId;
    @NotBlank(message = "Emission type is required") private String type;
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be positive")
    private BigDecimal quantity;
}

