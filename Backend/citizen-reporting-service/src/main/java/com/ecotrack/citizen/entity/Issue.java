package com.ecotrack.citizen.entity;

import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "issue")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "issue_id")
    private Long issueId;

    @Column(name = "citizen_id", nullable = false)
    private Long citizenId;

    @Column(nullable = false, length = 200)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType type;

    @Column(nullable = false, length = 255)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDateTime date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IssueStatus status = IssueStatus.OPEN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "issue_media", joinColumns = @JoinColumn(name = "issue_id"))
    @Column(name = "media_url", length = 512)
    @Builder.Default
    private List<String> mediaUrls = new ArrayList<>();

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
