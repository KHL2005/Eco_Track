package com.ecotrack.compliance.entity;

import com.ecotrack.compliance.enums.AuditStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "audit")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Audit {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id") private Long auditId;
    @Column(name = "officer_id", nullable = false) private Long officerId;
    @Column(nullable = false, length = 255) private String scope;
    @Column(columnDefinition = "TEXT") private String findings;
    @Column(nullable = false) private LocalDateTime date;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private AuditStatus status = AuditStatus.PLANNED;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

