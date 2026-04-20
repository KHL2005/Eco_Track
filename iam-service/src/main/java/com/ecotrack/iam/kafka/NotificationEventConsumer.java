package com.ecotrack.iam.kafka;

import com.ecotrack.iam.dto.NotificationRequest;
import com.ecotrack.iam.enums.NotificationCategory;
import com.ecotrack.iam.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

/**
 * Consumes domain events from all producer services and
 * persists them as Notification records in the IAM database.
 *
 * Topics:
 *  - ecotrack.issue.created       → citizen-reporting-service
 *  - ecotrack.analysis.completed  → environmental-monitoring-service
 *  - ecotrack.compliance.triggered → compliance-audit-service
 *  - ecotrack.project.events      → project-management-service
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationEventConsumer {

    private static final String GROUP = "iam-notification-group";

    private final NotificationService notificationService;

    @KafkaListener(topics = "ecotrack.issue.created", groupId = GROUP)
    public void onIssueCreated(EcoTrackEvent event) {
        log.info("Received ISSUE_CREATED event: userId={}, entityId={}", event.getUserId(), event.getEntityId());
        saveNotification(event, NotificationCategory.ISSUE);
    }

    @KafkaListener(topics = "ecotrack.analysis.completed", groupId = GROUP)
    public void onAnalysisCompleted(EcoTrackEvent event) {
        log.info("Received ANALYSIS_COMPLETED event: userId={}, entityId={}", event.getUserId(), event.getEntityId());
        saveNotification(event, NotificationCategory.GENERAL);
    }

    @KafkaListener(topics = "ecotrack.compliance.triggered", groupId = GROUP)
    public void onComplianceTriggered(EcoTrackEvent event) {
        log.info("Received COMPLIANCE_TRIGGERED event: userId={}, entityId={}", event.getUserId(), event.getEntityId());
        saveNotification(event, NotificationCategory.COMPLIANCE);
    }

    @KafkaListener(topics = "ecotrack.project.events", groupId = GROUP)
    public void onProjectEvent(EcoTrackEvent event) {
        log.info("Received PROJECT event: type={}, entityId={}", event.getEventType(), event.getEntityId());
        saveNotification(event, NotificationCategory.PROJECT);
    }

    // ─── Helper ──────────────────────────────────────────────────

    private void saveNotification(EcoTrackEvent event, NotificationCategory fallbackCategory) {
        try {
            // Determine category — use event's category if valid, otherwise use fallback
            NotificationCategory category = fallbackCategory;
            if (event.getCategory() != null) {
                try {
                    category = NotificationCategory.valueOf(event.getCategory());
                } catch (IllegalArgumentException ignored) {
                    // keep fallbackCategory
                }
            }

            NotificationRequest request = new NotificationRequest();
            request.setUserId(event.getUserId() != null ? event.getUserId() : 0L);
            request.setEntityId(event.getEntityId());
            request.setMessage(event.getMessage() != null ? event.getMessage() : event.getEventType());
            request.setCategory(category);

            notificationService.createNotification(request);
            log.info("Notification saved for eventType={}", event.getEventType());

        } catch (Exception e) {
            log.error("Failed to save notification for event {}: {}", event.getEventType(), e.getMessage());
        }
    }
}
