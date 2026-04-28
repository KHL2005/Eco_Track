package com.ecotrack.compliance.dto;

import com.ecotrack.compliance.enums.AuditStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class AuditResponse {
    private Long auditId;
    private Long officerId;
    private String scope;
    private String findings;
    private LocalDateTime date;
    private AuditStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

