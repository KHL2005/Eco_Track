package com.ecotrack.citizen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class DeleteIssueRequest {
    @NotBlank(message = "Please provide a reason for deleting this issue")
    @Size(min = 5, max = 500, message = "Deletion reason must be 5–500 characters")
    private String reason;
}
