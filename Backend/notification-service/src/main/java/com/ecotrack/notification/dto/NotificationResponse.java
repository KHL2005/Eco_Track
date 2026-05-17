package com.ecotrack.notification.dto;

import com.ecotrack.notification.enums.NotificationCategory;
import com.ecotrack.notification.enums.NotificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class NotificationResponse {
    private Long notificationId;
    private Long userId;
    private Long entityId;
    private String message;
    private NotificationCategory category;
    private NotificationStatus status;
    private LocalDateTime createdDate;
}


