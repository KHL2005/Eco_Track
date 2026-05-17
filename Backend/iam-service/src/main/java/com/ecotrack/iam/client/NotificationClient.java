package com.ecotrack.iam.client;

import com.ecotrack.iam.config.FeignClientConfig;
import com.ecotrack.iam.dto.request.NotificationRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", fallback = NotificationClientFallback.class, configuration = FeignClientConfig.class)
public interface NotificationClient {

    @PostMapping("/api/v1/notifications")
    void createNotification(@RequestBody NotificationRequest request);
}
