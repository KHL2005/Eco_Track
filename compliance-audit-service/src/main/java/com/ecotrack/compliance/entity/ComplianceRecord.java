package com.ecotrack.compliance.entity;

import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "compliance_record")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ComplianceRecord {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "compliance_id") private Long complianceId;
    @Column(name = "entity_id", nullable = false) private Long entityId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ComplianceType type;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ComplianceResult result;
    @Column(nullable = false) private LocalDateTime date;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

