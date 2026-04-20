package com.ecotrack.monitoring.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class CsvUploadResponse {
    private int totalRows;
    private int successCount;
    private int failCount;
    private String message;
}

