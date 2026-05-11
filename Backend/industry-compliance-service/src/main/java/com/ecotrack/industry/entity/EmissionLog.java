package com.ecotrack.industry.entity;

import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.EmissionType;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "emission_log")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EmissionLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id") private Long logId;
    @Column(name = "industry_id") private Long industryId;
    @Column(name = "registration_number", nullable = false, length = 100) private String registrationNumber;
    @Column(name = "industry_name", nullable = false, length = 500) private String industryName;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 100) private EmissionType type;
    @Column(nullable = false, precision = 12, scale = 4) private BigDecimal quantity;
    @Column(nullable = false, length = 1000) private String description;
    @Column(nullable = false) private LocalDateTime date;
    @Enumerated(EnumType.STRING) @Column(nullable = false) @Builder.Default
    private EmissionStatus status = EmissionStatus.SUBMITTED;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
