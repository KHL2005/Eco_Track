package com.ecotrack.iam.client;

import com.ecotrack.iam.dto.NotificationRequest;
import com.ecotrack.iam.dto.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class NotificationClientFallback implements NotificationClient {

    @Override
    public NotificationResponse createNotification(NotificationRequest request) {
        log.warn("Notification service unavailable. Skipping notification for userId={}", request.getUserId());
        return null;
    }

    @Override
    public List<NotificationResponse> getAllNotifications() {
        return Collections.emptyList();
    }

    @Override
    public List<NotificationResponse> getByUser(Long userId) {
        return Collections.emptyList();
    }

    @Override
    public List<NotificationResponse> getUnreadByUser(Long userId) {
        return Collections.emptyList();
    }

    @Override
    public NotificationResponse markAsRead(Long id) {
        return null;
    }

    @Override
    public NotificationResponse markAsArchived(Long id) {
        return null;
    }

    @Override
    public void markAllReadForUser(Long userId) {
    }

    @Override
    public void deleteNotification(Long id) {
    }
}
