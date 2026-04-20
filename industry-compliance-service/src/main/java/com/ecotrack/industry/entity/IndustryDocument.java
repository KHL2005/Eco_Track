package com.ecotrack.industry.entity;

import com.ecotrack.industry.enums.DocType;
import com.ecotrack.industry.enums.VerificationStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "industry_document")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class IndustryDocument {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id") private Long documentId;
    @Column(name = "industry_id", nullable = false) private Long industryId;
    @Enumerated(EnumType.STRING) @Column(name = "doc_type", nullable = false) private DocType docType;
    @Column(name = "file_uri", nullable = false, length = 500) private String fileUri;
    @Column(name = "uploaded_date", nullable = false) private LocalDateTime uploadedDate;
    @Enumerated(EnumType.STRING) @Column(name = "verification_status", nullable = false) @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.uploadedDate == null) this.uploadedDate = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}

