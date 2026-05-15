package com.ecotrack.iam.client;

import com.ecotrack.iam.config.FeignClientConfig;
import com.ecotrack.iam.dto.NotificationRequest;
import com.ecotrack.iam.dto.NotificationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "notification-service", fallback = NotificationClientFallback.class, configuration = FeignClientConfig.class)
public interface NotificationClient {

    @PostMapping("/api/v1/notifications")
    NotificationResponse createNotification(@RequestBody NotificationRequest request);

    @GetMapping("/api/v1/notifications")
    List<NotificationResponse> getAllNotifications();

    @GetMapping("/api/v1/notifications/user/{userId}")
    List<NotificationResponse> getByUser(@PathVariable Long userId);

    @GetMapping("/api/v1/notifications/user/{userId}/unread")
    List<NotificationResponse> getUnreadByUser(@PathVariable Long userId);

    @PatchMapping("/api/v1/notifications/{id}/read")
    NotificationResponse markAsRead(@PathVariable Long id);

    @PatchMapping("/api/v1/notifications/{id}/archive")
    NotificationResponse markAsArchived(@PathVariable Long id);

    @PatchMapping("/api/v1/notifications/user/{userId}/read-all")
    void markAllReadForUser(@PathVariable Long userId);

    @DeleteMapping("/api/v1/notifications/{id}")
    void deleteNotification(@PathVariable Long id);
}


