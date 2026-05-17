package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.EmissionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmissionLogRequest {
    @NotBlank(message = "Registration number is required") private String registrationNumber;
    @NotBlank(message = "Industry name is required") private String industryName;
    @NotNull(message = "Emission type is required") private EmissionType type;
    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be positive")
    private BigDecimal quantity;
    @NotBlank(message = "Description is required") private String description;
}

