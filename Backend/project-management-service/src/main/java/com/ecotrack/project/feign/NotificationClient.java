package com.ecotrack.project.feign;

import com.ecotrack.project.config.FeignClientConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "notification-service", fallback = NotificationClientFallback.class, configuration = FeignClientConfig.class)
public interface NotificationClient {

    @PostMapping("/api/v1/notifications")
    void createNotification(@RequestBody NotificationRequest request);
}
