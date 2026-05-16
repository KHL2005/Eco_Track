package com.ecotrack.iam.client;

import com.ecotrack.iam.dto.request.NotificationRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class NotificationClientFallback implements NotificationClient {

    @Override
    public void createNotification(NotificationRequest request) {
        log.warn("Notification service unavailable. Skipping notification for userId={}", request.getUserId());
    }
}
