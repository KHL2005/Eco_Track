package com.ecotrack.iam.kafka;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Incoming Kafka event payload (matches producers in other services).
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class EcoTrackEvent {
    private String eventType;
    private Long   userId;
    private Long   entityId;
    private String message;
    private String category;
}

