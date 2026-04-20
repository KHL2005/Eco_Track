package com.ecotrack.citizen.controller;

import com.ecotrack.citizen.dto.*;
import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import com.ecotrack.citizen.enums.ResolutionStatus;
import com.ecotrack.citizen.service.IssueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/issues")
@RequiredArgsConstructor
@Tag(name = "Citizen Issue Management", description = "APIs for reporting and managing environmental issues")
public class IssueController {

    private final IssueService issueService;

    // ─── Issue Endpoints ─────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Report a new environmental issue")
    @PreAuthorize("hasAnyAuthority('CITIZEN','OFFICER','ADMIN')")
    public ResponseEntity<IssueResponse> createIssue(@Valid @RequestBody IssueRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.createIssue(request));
    }

    @GetMapping
    @Operation(summary = "Get all issues")
    public ResponseEntity<List<IssueResponse>> getAllIssues() {
        return ResponseEntity.ok(issueService.getAllIssues());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get issue by ID")
    public ResponseEntity<IssueResponse> getIssueById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(issueService.getIssueById(id));
    }

    @GetMapping("/citizen/{citizenId}")
    @Operation(summary = "Get all issues reported by a specific citizen")
    public ResponseEntity<List<IssueResponse>> getIssuesByCitizen(@PathVariable("citizenId") Long citizenId) {
        return ResponseEntity.ok(issueService.getIssuesByCitizen(citizenId));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get issues by status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)")
    public ResponseEntity<List<IssueResponse>> getIssuesByStatus(@PathVariable("status") IssueStatus status) {
        return ResponseEntity.ok(issueService.getIssuesByStatus(status));
    }

    @GetMapping("/type/{type}")
    @Operation(summary = "Get issues by type (AIR_POLLUTION, WATER_POLLUTION, etc.)")
    public ResponseEntity<List<IssueResponse>> getIssuesByType(@PathVariable("type") IssueType type) {
        return ResponseEntity.ok(issueService.getIssuesByType(type));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partially update issue fields (location, description, type)")
    @PreAuthorize("hasAnyAuthority('CITIZEN','OFFICER','ADMIN')")
    public ResponseEntity<IssueResponse> updateIssue(@PathVariable("id") Long id,
                                                      @RequestBody IssueRequest request) {
        return ResponseEntity.ok(issueService.updateIssue(id, request));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update issue status (OPEN->IN_PROGRESS->RESOLVED->CLOSED)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<IssueResponse> updateIssueStatus(@PathVariable("id") Long id,
                                                            @Valid @RequestBody IssueStatusUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateIssueStatus(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete issue and its linked resolution")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<Void> deleteIssue(@PathVariable("id") Long id) {
        issueService.deleteIssue(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Resolution Endpoints ─────────────────────────────────────

    @PostMapping("/{issueId}/resolutions")
    @Operation(summary = "Add a resolution for a specific issue")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<ResolutionResponse> addResolution(@PathVariable("issueId") Long issueId,
                                                             @Valid @RequestBody ResolutionRequest request) {
        request.setIssueId(issueId);
        return ResponseEntity.status(HttpStatus.CREATED).body(issueService.addResolution(request));
    }

    @GetMapping("/{issueId}/resolutions")
    @Operation(summary = "Get resolution for a specific issue")
    public ResponseEntity<ResolutionResponse> getResolutionByIssue(@PathVariable("issueId") Long issueId) {
        return ResponseEntity.ok(issueService.getResolutionByIssue(issueId));
    }

    @GetMapping("/resolutions")
    @Operation(summary = "Get all resolutions")
    public ResponseEntity<List<ResolutionResponse>> getAllResolutions() {
        return ResponseEntity.ok(issueService.getAllResolutions());
    }

    @GetMapping("/resolutions/{resolutionId}")
    @Operation(summary = "Get resolution by ID")
    public ResponseEntity<ResolutionResponse> getResolutionById(@PathVariable("resolutionId") Long resolutionId) {
        return ResponseEntity.ok(issueService.getResolutionById(resolutionId));
    }

    @GetMapping("/resolutions/officer/{officerId}")
    @Operation(summary = "Get all resolutions by agency officer ID")
    public ResponseEntity<List<ResolutionResponse>> getResolutionsByOfficer(@PathVariable("officerId") Long officerId) {
        return ResponseEntity.ok(issueService.getResolutionsByOfficer(officerId));
    }

    @GetMapping("/resolutions/status/{status}")
    @Operation(summary = "Get resolutions by status (PENDING, IN_PROGRESS, COMPLETED)")
    public ResponseEntity<List<ResolutionResponse>> getResolutionsByStatus(@PathVariable("status") ResolutionStatus status) {
        return ResponseEntity.ok(issueService.getResolutionsByStatus(status));
    }

    @PatchMapping("/resolutions/{resolutionId}")
    @Operation(summary = "Update resolution status and/or actions (partial update)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<ResolutionResponse> updateResolution(@PathVariable("resolutionId") Long resolutionId,
                                                                @Valid @RequestBody ResolutionStatusUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateResolution(resolutionId, request));
    }

    @DeleteMapping("/resolutions/{resolutionId}")
    @Operation(summary = "Delete a resolution (reverts issue status to OPEN)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<Void> deleteResolution(@PathVariable("resolutionId") Long resolutionId) {
        issueService.deleteResolution(resolutionId);
        return ResponseEntity.noContent().build();
    }
}
