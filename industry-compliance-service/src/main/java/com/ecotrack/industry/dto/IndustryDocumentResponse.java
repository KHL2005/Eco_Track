package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.DocType;
import com.ecotrack.industry.enums.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class IndustryDocumentResponse {
    private Long documentId;
    private Long industryId;
    private DocType docType;
    private String fileUri;
    private LocalDateTime uploadedDate;
    private VerificationStatus verificationStatus;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

