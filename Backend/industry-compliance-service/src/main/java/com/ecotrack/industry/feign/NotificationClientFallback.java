package com.ecotrack.industry.feign;

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
