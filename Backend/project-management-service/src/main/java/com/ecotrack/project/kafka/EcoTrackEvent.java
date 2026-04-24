package com.ecotrack.project.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic event payload published to Kafka topics by project-management-service.
 * Consumed by iam-service (NotificationEventConsumer) to create in-app notifications.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EcoTrackEvent {

    /** Event type identifier (e.g. PROJECT_CREATED, MILESTONE_COMPLETED). */
    private String eventType;

    /** ID of the user to notify (manager / relevant officer). */
    private Long userId;

    /** ID of the entity that triggered the event (projectId, milestoneId, etc.). */
    private Long entityId;

    /** Human-readable notification message. */
    private String message;

    /** Notification category used by IAM consumer (e.g. "PROJECT", "MILESTONE"). */
    private String category;
}

