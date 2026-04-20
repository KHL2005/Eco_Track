package com.ecotrack.monitoring.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "iam-service", fallback = IamServiceClientFallback.class)
public interface IamServiceClient {

    @GetMapping("/api/v1/internal/users/{id}")
    UserDto getUserById(@PathVariable Long id);

    @GetMapping("/api/v1/internal/users/{id}/exists")
    Boolean userExists(@PathVariable Long id);
}
