package com.ecotrack.iam.dto;

import com.ecotrack.iam.enums.NotificationCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class NotificationRequest {
    @NotNull(message = "User ID is required")
    private Long userId;
    private Long entityId;
    @NotBlank(message = "Message is required")
    private String message;
    @NotNull(message = "Category is required")
    private NotificationCategory category;
}

