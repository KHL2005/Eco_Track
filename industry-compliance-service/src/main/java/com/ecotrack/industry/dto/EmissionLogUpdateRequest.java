package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.EmissionStatus;
import jakarta.validation.constraints.DecimalMin;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class EmissionLogUpdateRequest {
    private String type;

    @DecimalMin(value = "0.0", inclusive = false, message = "Quantity must be positive")
    private BigDecimal quantity;

    private EmissionStatus status;
}

