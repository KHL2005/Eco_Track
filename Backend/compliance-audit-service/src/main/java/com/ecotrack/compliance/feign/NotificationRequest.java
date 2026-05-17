package com.ecotrack.compliance.feign;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationRequest {
    private Long userId;
    private Long entityId;
    private String message;
    private NotificationCategory category;
}
