package com.ecotrack.compliance.kafka;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Generic Kafka event payload sent from compliance-audit-service.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class EcoTrackEvent {
    private String eventType;
    private Long   userId;
    private Long   entityId;
    private String message;
    private String category;
}

