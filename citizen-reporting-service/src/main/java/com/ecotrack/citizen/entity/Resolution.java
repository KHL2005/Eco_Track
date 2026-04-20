package com.ecotrack.citizen.entity;

import com.ecotrack.citizen.enums.ResolutionStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "resolution")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Resolution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "resolution_id")
    private Long resolutionId;

    @Column(name = "issue_id", nullable = false, unique = true)
    private Long issueId;

    @Column(name = "officer_id", nullable = false)
    private Long officerId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String actions;

    @Column(nullable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ResolutionStatus status = ResolutionStatus.PENDING;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.date == null) this.date = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}

