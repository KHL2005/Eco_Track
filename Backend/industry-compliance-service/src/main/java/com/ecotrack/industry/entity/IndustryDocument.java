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
    @Column(name = "industry_id") private Long industryId;
    @Column(name = "registration_number", nullable = false, length = 100) private String registrationNumber;
    @Column(name = "industry_name", nullable = false, length = 500) private String industryName;
    @Enumerated(EnumType.STRING) @Column(name = "doc_type", nullable = false) private DocType docType;
    @Column(name = "file_uri", nullable = false, length = 500) private String fileUri;
    @Column(name = "grid_fs_file_id", length = 24) private String gridFsFileId;
    @Column(name = "file_name", length = 255) private String fileName;
    @Column(name = "description", nullable = false, length = 1000) private String description;
    @Column(name = "uploaded_date", nullable = false) private LocalDateTime uploadedDate;
    @Enumerated(EnumType.STRING) @Column(name = "verification_status", nullable = false) @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.SUBMITTED;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @PrePersist protected void onCreate() {
        this.createdAt = LocalDateTime.now(); this.updatedAt = LocalDateTime.now();
        if (this.uploadedDate == null) this.uploadedDate = LocalDateTime.now();
    }
    @PreUpdate protected void onUpdate() { this.updatedAt = LocalDateTime.now(); }
}
