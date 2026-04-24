package com.ecotrack.compliance.feign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * Mirror DTO of IAM Service UserResponse for Feign communication.
 * Uses String for role/status to avoid enum coupling between services.
 */
@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class UserDto {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String status;
    private LocalDateTime createdAt;
}

