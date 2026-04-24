package com.ecotrack.project.entity;

import com.ecotrack.project.enums.ReportScope;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "report")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id") private Long reportId;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private ReportScope scope;
    @Column(nullable = false, columnDefinition = "TEXT") private String metrics;
    @Column(name = "generated_date", nullable = false) private LocalDateTime generatedDate;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.generatedDate == null) this.generatedDate = LocalDateTime.now();
    }
}

