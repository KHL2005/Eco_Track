package com.ecotrack.iam.dto.request;

import com.ecotrack.iam.enums.NotificationCategory;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class NotificationRequest {
    @NotNull(message = "User ID is required")
    @Positive(message = "User ID must be a positive number")
    private Long userId;

    @Positive(message = "Entity ID must be a positive number")
    private Long entityId;

    @NotBlank(message = "Message is required")
    @Size(max = 500, message = "Message must not exceed 500 characters")
    private String message;

    @NotNull(message = "Category is required")
    private NotificationCategory category;
}
