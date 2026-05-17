package com.ecotrack.iam.dto.request;

import com.ecotrack.iam.enums.UserStatus;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateUserRequest {
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name must contain only letters, spaces, hyphens, or apostrophes")
    private String name;

    @Pattern(regexp = "^[+]?[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    private UserStatus status;
}
