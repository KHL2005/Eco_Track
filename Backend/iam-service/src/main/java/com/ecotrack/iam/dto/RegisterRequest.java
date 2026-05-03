package com.ecotrack.iam.dto;

import com.ecotrack.iam.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 50, message = "Name must be between 2 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name must contain only letters, spaces, hyphens, or apostrophes")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100, message = "Password must be between 8 and 100 characters")
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
             message = "Password must have min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character")
    private String password;

    @Pattern(regexp = "^[+]?[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    private String phone;

    // Role is ignored on public registration — always defaults to CITIZEN
    private UserRole role;
}

