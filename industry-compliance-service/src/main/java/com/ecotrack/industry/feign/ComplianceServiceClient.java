package com.ecotrack.industry.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@FeignClient(name = "compliance-audit-service", fallback = ComplianceServiceClientFallback.class)
public interface ComplianceServiceClient {

    @PostMapping("/api/v1/compliance")
    ComplianceRecordDto createComplianceRecord(@RequestBody ComplianceRecordCreateDto request);

    @GetMapping("/api/v1/compliance/entity/{entityId}")
    List<ComplianceRecordDto> getComplianceByEntityId(@PathVariable Long entityId);
}

