package com.ecotrack.project.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

/**
 * Publishes project lifecycle events to Kafka.
 * Topics are consumed by iam-service to generate in-app notifications.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    public static final String TOPIC_PROJECT = "ecotrack.project.events";

    private final KafkaTemplate<String, EcoTrackEvent> kafkaTemplate;

    public void publishProjectCreated(Long projectId, String title) {
        EcoTrackEvent event = EcoTrackEvent.builder()
                .eventType("PROJECT_CREATED")
                .entityId(projectId)
                .message("New sustainability project created: " + title)
                .category("PROJECT")
                .build();
        kafkaTemplate.send(TOPIC_PROJECT, event);
        log.info("Published PROJECT_CREATED event for projectId={}", projectId);
    }

    public void publishMilestoneCompleted(Long projectId, Long milestoneId, String title) {
        EcoTrackEvent event = EcoTrackEvent.builder()
                .eventType("MILESTONE_COMPLETED")
                .entityId(milestoneId)
                .message("Milestone '" + title + "' completed for project #" + projectId)
                .category("MILESTONE")
                .build();
        kafkaTemplate.send(TOPIC_PROJECT, event);
        log.info("Published MILESTONE_COMPLETED event for milestoneId={}", milestoneId);
    }
}

