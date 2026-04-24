package com.ecotrack.industry.dto;

import com.ecotrack.industry.enums.DocType;
import com.ecotrack.industry.enums.VerificationStatus;
import lombok.Data;

@Data
public class IndustryDocumentUpdateRequest {
    private DocType docType;
    private String fileUri;
    private VerificationStatus verificationStatus;
}

