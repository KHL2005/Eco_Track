package com.ecotrack.citizen.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic Kafka event payload sent from citizen-reporting-service.
 * Serialized as JSON.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EcoTrackEvent {
    private String eventType;   // e.g. "ISSUE_CREATED"
    private Long   userId;      // recipient user ID for notification
    private Long   entityId;    // related entity ID (issueId, analysisId, etc.)
    private String message;     // human-readable notification text
    private String category;    // maps to NotificationCategory enum name
}

