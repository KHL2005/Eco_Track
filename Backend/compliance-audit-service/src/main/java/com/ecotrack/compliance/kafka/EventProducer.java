package com.ecotrack.compliance.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes compliance-triggered events to Kafka.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    public static final String TOPIC_COMPLIANCE = "ecotrack.compliance.triggered";

    private final KafkaTemplate<String, EcoTrackEvent> kafkaTemplate;

    public void publishComplianceTriggered(Long entityId, Long complianceId, String result) {
        EcoTrackEvent event = EcoTrackEvent.builder()
                .eventType("COMPLIANCE_TRIGGERED")
                .userId(entityId)
                .entityId(complianceId)
                .message("Compliance record #" + complianceId + " created with result: " + result)
                .category("COMPLIANCE")
                .build();
        kafkaTemplate.send(TOPIC_COMPLIANCE, event);
        log.info("Published COMPLIANCE_TRIGGERED event for complianceId={}", complianceId);
    }
}

