package com.ecotrack.project.controller;

import com.ecotrack.project.dto.*;
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

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
@Tag(name = "Sustainability Projects", description = "Project tracking, milestones and impact APIs")
public class ProjectController {

    private final ProjectService projectService;

    // ─── Project Endpoints ────────────────────────────────────────

    @PostMapping
    @Operation(summary = "Create a sustainability project")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable("id") Long id,
                                                          @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete project and all linked milestones and impact")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable("id") Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Milestone Endpoints ──────────────────────────────────────

    @PostMapping("/{projectId}/milestones")
    @Operation(summary = "Add a milestone to a project (projectId required)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<MilestoneResponse> updateMilestone(@PathVariable("milestoneId") Long milestoneId,
                                                              @RequestBody MilestoneRequest request) {
        return ResponseEntity.ok(projectService.updateMilestone(milestoneId, request));
    }

    @DeleteMapping("/milestones/{milestoneId}")
    @Operation(summary = "Delete a milestone by ID")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<Void> deleteMilestone(@PathVariable("milestoneId") Long milestoneId) {
        projectService.deleteMilestone(milestoneId);
        return ResponseEntity.noContent().build();
    }

    // ─── Impact Endpoints ─────────────────────────────────────────

    @PostMapping("/{projectId}/impact")
    @Operation(summary = "Add or update impact for a project (projectId required)")
    @PreAuthorize("hasAnyAuthority('OFFICER','SCIENTIST','ADMIN')")
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
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<ImpactResponse> updateImpactStatus(@PathVariable("projectId") Long projectId,
                                                              @RequestParam("status") ImpactStatus status) {
        return ResponseEntity.ok(projectService.updateImpactStatus(projectId, status));
    }

    @DeleteMapping("/{projectId}/impact")
    @Operation(summary = "Delete impact for a project")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Void> deleteImpact(@PathVariable("projectId") Long projectId) {
        projectService.deleteImpact(projectId);
        return ResponseEntity.noContent().build();
    }
}
