package com.ecotrack.citizen.dto;

import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder @AllArgsConstructor @NoArgsConstructor
public class IssueResponse {
    private Long issueId;
    private Long citizenId;
    private String title;
    private IssueType type;
    private String location;
    private String description;
    private LocalDateTime date;
    private IssueStatus status;
    private List<String> mediaUrls;
    private String deletionReason;
    private LocalDateTime deletedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
