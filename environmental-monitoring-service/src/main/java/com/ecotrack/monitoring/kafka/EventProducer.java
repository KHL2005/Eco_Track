package com.ecotrack.monitoring.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes analysis-completed events to Kafka.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    public static final String TOPIC_ANALYSIS = "ecotrack.analysis.completed";

    private final KafkaTemplate<String, EcoTrackEvent> kafkaTemplate;

    public void publishAnalysisCompleted(Long scientistId, Long analysisId, Long sensorId) {
        EcoTrackEvent event = EcoTrackEvent.builder()
                .eventType("ANALYSIS_COMPLETED")
                .userId(scientistId)
                .entityId(analysisId)
                .message("Analysis #" + analysisId + " reviewed for sensor #" + sensorId)
                .category("GENERAL")
                .build();
        kafkaTemplate.send(TOPIC_ANALYSIS, event);
        log.info("Published ANALYSIS_COMPLETED event for analysisId={}", analysisId);
    }
}

