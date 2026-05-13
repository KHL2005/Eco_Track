package com.ecotrack.iam.dto;

import com.ecotrack.iam.enums.UserRole;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Please enter your full name")
    @Size(min = 3, message = "Name is too short — please use at least 3 characters")
    @Size(max = 50, message = "Name is too long — please keep it under 50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]+$", message = "Name can contain only letters, spaces, hyphens or apostrophes")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email — please include '@' and a valid domain (e.g. you@example.com)")
    @Size(max = 100, message = "Email is too long — maximum 100 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Create a stronger password — use at least 8 characters")
    @Size(max = 100, message = "Password is too long — keep it under 100 characters")
    @Pattern(regexp = ".*[A-Z].*", message = "Create a stronger password — add at least one uppercase letter (A–Z)")
    @Pattern(regexp = ".*[a-z].*", message = "Create a stronger password — add at least one lowercase letter (a–z)")
    @Pattern(regexp = ".*[0-9].*", message = "Create a stronger password — add at least one number (0–9)")
    @Pattern(regexp = ".*[@#$%^&+=!].*", message = "Create a stronger password — add at least one special character (@ # $ % ^ & + = !)")
    @Pattern(regexp = "\\S+", message = "Password must not contain spaces")
    private String password;

    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must be exactly 10 digits")
    @Pattern(regexp = "^[6-9].*", message = "Not an Indian mobile number — Indian numbers start with 6, 7, 8 or 9")
    private String phone;

    // Role is ignored on public registration — always defaults to CITIZEN
    private UserRole role;
}

