package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class IssueResponse {
    private Long issueId;
    private Long citizenId;
    private IssueType type;
    private String location;
    private String description;
    private LocalDateTime date;
    private IssueStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

