package com.ecotrack.citizen.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes domain events to Kafka topics.
 * Called after successful CRUD operations — does NOT block the main flow.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    public static final String TOPIC_ISSUE = "ecotrack.issue.created";

    private final KafkaTemplate<String, EcoTrackEvent> kafkaTemplate;

    public void publishIssueCreated(Long citizenId, Long issueId, String location) {
        EcoTrackEvent event = EcoTrackEvent.builder()
                .eventType("ISSUE_CREATED")
                .userId(citizenId)
                .entityId(issueId)
                .message("New environmental issue reported at: " + location)
                .category("ISSUE")
                .build();
        kafkaTemplate.send(TOPIC_ISSUE, event);
        log.info("Published ISSUE_CREATED event for issueId={}", issueId);
    }
}

