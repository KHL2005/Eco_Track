package com.ecotrack.project.controller;

import com.ecotrack.project.dto.*;
import com.ecotrack.project.dto.ImpactMetrics;
import com.ecotrack.project.enums.ImpactStatus;
import com.ecotrack.project.enums.MilestoneStatus;
import com.ecotrack.project.enums.ProjectStatus;
import com.ecotrack.project.service.ProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Sustainability Projects", description = "Project tracking, milestones and impact APIs")
public class ProjectController {

    private final ProjectService projectService;

    // ─── Project Endpoints ────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a sustainability project")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ProjectResponse> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    @GetMapping
    @Operation(summary = "Get all projects")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get project by ID")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get projects by status (PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED)")
    public ResponseEntity<List<ProjectResponse>> getProjectsByStatus(@PathVariable("status") ProjectStatus status) {
        return ResponseEntity.ok(projectService.getProjectsByStatus(status));
    }

    @PatchMapping("/{id}")
    @Operation(summary = "Partially update a project (title, description, dates, budget, status)")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable("id") Long id,
                                                          @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project and all linked milestones and impact")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR','SUPER_ADMIN','AGENCY_OFFICER')")
    public ResponseEntity<Void> deleteProject(@PathVariable("id") Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Milestone Endpoints ──────────────────────────────────────

    @PostMapping("/{projectId}/milestones")
    @Operation(summary = "Add a milestone to a project (projectId required)")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<MilestoneResponse> addMilestone(@PathVariable("projectId") Long projectId,
                                                           @Valid @RequestBody MilestoneRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addMilestone(projectId, request));
    }

    @GetMapping("/{projectId}/milestones")
    @Operation(summary = "Get all milestones for a project")
    public ResponseEntity<List<MilestoneResponse>> getMilestonesByProject(@PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(projectService.getMilestonesByProject(projectId));
    }

    @GetMapping("/milestones/{milestoneId}")
    @Operation(summary = "Get milestone by its ID")
    public ResponseEntity<MilestoneResponse> getMilestoneById(@PathVariable("milestoneId") Long milestoneId) {
        return ResponseEntity.ok(projectService.getMilestoneById(milestoneId));
    }

    @GetMapping("/milestones/status/{status}")
    @Operation(summary = "Get milestones by status (PENDING, IN_PROGRESS, COMPLETED, DELAYED)")
    public ResponseEntity<List<MilestoneResponse>> getMilestonesByStatus(@PathVariable("status") MilestoneStatus status) {
        return ResponseEntity.ok(projectService.getMilestonesByStatus(status));
    }

    @PatchMapping("/milestones/{milestoneId}")
    @Operation(summary = "Partially update a milestone (title, date, status)")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<MilestoneResponse> updateMilestone(@PathVariable("milestoneId") Long milestoneId,
                                                              @RequestBody MilestoneRequest request) {
        return ResponseEntity.ok(projectService.updateMilestone(milestoneId, request));
    }

    @DeleteMapping("/milestones/{milestoneId}")
    @Operation(summary = "Delete a milestone by ID")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteMilestone(@PathVariable("milestoneId") Long milestoneId) {
        projectService.deleteMilestone(milestoneId);
        return ResponseEntity.noContent().build();
    }

    // ─── Impact Endpoints ─────────────────────────────────────────

    @PostMapping("/{projectId}/impact")
    @Operation(summary = "Add or update impact for a project (projectId required)")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','SCIENTIST','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ImpactResponse> addOrUpdateImpact(@PathVariable("projectId") Long projectId,
                                                             @Valid @RequestBody ImpactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(projectService.addOrUpdateImpact(projectId, request));
    }

    @GetMapping("/{projectId}/impact")
    @Operation(summary = "Get impact for a specific project")
    public ResponseEntity<ImpactResponse> getImpactByProject(@PathVariable("projectId") Long projectId) {
        return ResponseEntity.ok(projectService.getImpactByProject(projectId));
    }

    @GetMapping("/impact/{impactId}")
    @Operation(summary = "Get impact by its own ID")
    public ResponseEntity<ImpactResponse> getImpactById(@PathVariable("impactId") Long impactId) {
        return ResponseEntity.ok(projectService.getImpactById(impactId));
    }

    @GetMapping("/impact/status/{status}")
    @Operation(summary = "Get impacts by status (DRAFT, PUBLISHED, ARCHIVED)")
    public ResponseEntity<List<ImpactResponse>> getImpactsByStatus(@PathVariable("status") ImpactStatus status) {
        return ResponseEntity.ok(projectService.getImpactsByStatus(status));
    }

    @PatchMapping("/{projectId}/impact/status")
    @Operation(summary = "Update impact status for a project (DRAFT, PUBLISHED, ARCHIVED)")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ImpactResponse> updateImpactStatus(@PathVariable("projectId") Long projectId,
                                                              @RequestParam("status") ImpactStatus status) {
        return ResponseEntity.ok(projectService.updateImpactStatus(projectId, status));
    }

    @PatchMapping("/{projectId}/impact/metrics")
    @Operation(summary = "Partially update predefined impact metrics — only provided fields are updated, customMetrics are merged",
               description = "For a pollution project you can later add treesPlanted, co2ReducedTons etc. " +
                             "without resetting the existing metrics. Null fields are ignored.")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','SCIENTIST','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ImpactResponse> patchMetrics(@PathVariable("projectId") Long projectId,
                                                        @RequestBody ImpactMetrics patch) {
        return ResponseEntity.ok(projectService.patchMetrics(projectId, patch));
    }

    @PatchMapping("/{projectId}/impact/metrics/custom")
    @Operation(summary = "Add or update custom metric key-value pairs — merged into existing custom metrics",
               description = "Use this to add any project-specific metric. " +
                             "Example: { \"aqiBefore\": 180, \"aqiAfter\": 95, \"treesPlantedNearFactory\": 50 }")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','SCIENTIST','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ImpactResponse> addOrUpdateCustomMetrics(@PathVariable("projectId") Long projectId,
                                                                    @RequestBody Map<String, Object> customEntries) {
        return ResponseEntity.ok(projectService.addOrUpdateCustomMetrics(projectId, customEntries));
    }

    @DeleteMapping("/{projectId}/impact/metrics/custom/{key}")
    @Operation(summary = "Remove a single custom metric key from an impact",
               description = "Example: DELETE /projects/1/impact/metrics/custom/aqiBefore")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ImpactResponse> removeCustomMetric(@PathVariable("projectId") Long projectId,
                                                              @PathVariable("key") String key) {
        return ResponseEntity.ok(projectService.removeCustomMetric(projectId, key));
    }

    @DeleteMapping("/{projectId}/impact")
    @Operation(summary = "Delete impact for a project")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteImpact(@PathVariable("projectId") Long projectId) {
        projectService.deleteImpact(projectId);
        return ResponseEntity.noContent().build();
    }
}
