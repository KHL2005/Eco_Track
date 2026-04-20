package com.ecotrack.industry.feign;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@Slf4j
public class ComplianceServiceClientFallback implements ComplianceServiceClient {

    @Override
    public ComplianceRecordDto createComplianceRecord(ComplianceRecordCreateDto request) {
        log.warn("Compliance service unavailable. Returning fallback for entity: {}", request.getEntityId());
        return ComplianceRecordDto.builder()
                .entityId(request.getEntityId())
                .type(request.getType())
                .result("PENDING")
                .notes("Compliance record creation deferred - service unavailable")
                .build();
    }

    @Override
    public List<ComplianceRecordDto> getComplianceByEntityId(Long entityId) {
        log.warn("Compliance service unavailable. Returning empty list for entity: {}", entityId);
        return Collections.emptyList();
    }
}

