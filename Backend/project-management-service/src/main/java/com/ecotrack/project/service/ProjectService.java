package com.ecotrack.project.service;

import com.ecotrack.project.dto.*;
import com.ecotrack.project.dto.ImpactMetrics;
import com.ecotrack.project.entity.*;
import com.ecotrack.project.enums.*;
import com.ecotrack.project.exception.BadRequestException;
import com.ecotrack.project.exception.ProjectNotFoundException;
import com.ecotrack.project.exception.ResourceNotFoundException;
import com.ecotrack.project.feign.NotificationCategory;
import com.ecotrack.project.feign.NotificationClient;
import com.ecotrack.project.feign.NotificationRequest;
import com.ecotrack.project.repository.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ImpactRepository impactRepository;
    private final NotificationClient notificationClient;

    // ─── Project CRUD ─────────────────────────────────────────────

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        if (request.getEndDate() != null && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
        }
        
        // Validate budget
        if (request.getBudget() != null && request.getBudget().signum() <= 0) {
            throw new BadRequestException("Budget must be greater than zero");
        }
        
        Project project = Project.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .budget(request.getBudget())
                .status(request.getStatus() != null ? request.getStatus() : ProjectStatus.PLANNED)
                .build();
        project = projectRepository.save(project);
        Long userId = getUserIdFromRequest();
        if (userId != null) {
            notify(userId, project.getProjectId(),
                    "Project '" + project.getTitle() + "' has been created successfully.",
                    NotificationCategory.PROJECT);
        }
        return toProjectResponse(project);
    }

    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    public ProjectResponse getProjectById(Long id) {
        return toProjectResponse(findProjectById(id));
    }

    public List<ProjectResponse> getProjectsByStatus(ProjectStatus status) {
        if (status == null) throw new BadRequestException("Status is required");
        return projectRepository.findByStatus(status).stream()
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = findProjectById(id);
        // Partial update — only set provided fields
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            project.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStartDate() != null) {
            project.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            if (request.getEndDate().isBefore(project.getStartDate())) {
                throw new BadRequestException("End date cannot be before start date");
            }
            project.setEndDate(request.getEndDate());
        }
        if (request.getBudget() != null) {
            if (request.getBudget().signum() <= 0) {
                throw new BadRequestException("Budget must be greater than zero");
            }
            project.setBudget(request.getBudget());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        return toProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id) {
        findProjectById(id); // throws ProjectNotFoundException if not found
        // Cascade delete milestones and impact linked to this project
        milestoneRepository.deleteAllByProjectId(id);
        impactRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
        log.info("Project {} and all linked milestones/impact deleted", id);
    }

    // ─── Milestone CRUD ──────────────────────────────────────────

    @Transactional
    public MilestoneResponse addMilestone(Long projectId, MilestoneRequest request) {
        Project project = findProjectById(projectId); // validates project exists, throws ProjectNotFoundException
        
        // Validate milestone date is within project duration
        if (request.getDate().isBefore(project.getStartDate())) {
            throw new BadRequestException("Milestone date cannot be before project start date (" + project.getStartDate() + ")");
        }
        if (project.getEndDate() != null && request.getDate().isAfter(project.getEndDate())) {
            throw new BadRequestException("Milestone date cannot be after project end date (" + project.getEndDate() + ")");
        }
        
        // Validate sequential order - milestone date should be >= latest existing milestone date
        List<Milestone> existingMilestones = milestoneRepository.findByProjectId(projectId);
        if (!existingMilestones.isEmpty()) {
            Milestone latestMilestone = existingMilestones.stream()
                    .max((m1, m2) -> m1.getDate().compareTo(m2.getDate()))
                    .orElse(null);
            if (latestMilestone != null && request.getDate().isBefore(latestMilestone.getDate())) {
                throw new BadRequestException("Milestone date must be after the latest milestone date (" + latestMilestone.getDate() + ")");
            }
        }
        
        Milestone milestone = Milestone.builder()
                .projectId(projectId)
                .title(request.getTitle())
                .description(request.getDescription())
                .date(request.getDate())
                .status(request.getStatus() != null ? request.getStatus() : MilestoneStatus.PENDING)
                .build();
        Milestone saved = milestoneRepository.save(milestone);

        // Auto-update project status based on milestones
        updateProjectStatusBasedOnMilestones(projectId);

        Long userId = getUserIdFromRequest();
        if (userId != null) {
            notify(userId, saved.getMilestoneId(),
                    "Milestone '" + saved.getTitle() + "' has been added to project #" + projectId + ".",
                    NotificationCategory.PROJECT);
        }
        return toMilestoneResponse(saved);
    }

    public MilestoneResponse getMilestoneById(Long milestoneId) {
        return toMilestoneResponse(findMilestoneById(milestoneId));
    }

    public List<MilestoneResponse> getMilestonesByProject(Long projectId) {
        findProjectById(projectId); // validate project exists
        return milestoneRepository.findByProjectId(projectId).stream()
                .map(this::toMilestoneResponse)
                .collect(Collectors.toList());
    }

    public List<MilestoneResponse> getMilestonesByStatus(MilestoneStatus status) {
        if (status == null) throw new BadRequestException("Status is required");
        return milestoneRepository.findByStatus(status).stream()
                .map(this::toMilestoneResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public MilestoneResponse updateMilestone(Long milestoneId, MilestoneRequest request) {
        Milestone milestone = findMilestoneById(milestoneId);
        Long projectId = milestone.getProjectId();
        Project project = findProjectById(projectId);
        
        // Partial update — only update provided fields
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            milestone.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            milestone.setDescription(request.getDescription());
        }
        if (request.getDate() != null) {
            // Validate new milestone date is within project duration
            if (request.getDate().isBefore(project.getStartDate())) {
                throw new BadRequestException("Milestone date cannot be before project start date (" + project.getStartDate() + ")");
            }
            if (project.getEndDate() != null && request.getDate().isAfter(project.getEndDate())) {
                throw new BadRequestException("Milestone date cannot be after project end date (" + project.getEndDate() + ")");
            }
            
            // Validate sequential order
            List<Milestone> otherMilestones = milestoneRepository.findByProjectId(projectId).stream()
                    .filter(m -> !m.getMilestoneId().equals(milestoneId))
                    .toList();
            
            Milestone latestBefore = otherMilestones.stream()
                    .filter(m -> m.getDate().isBefore(request.getDate()))
                    .max((m1, m2) -> m1.getDate().compareTo(m2.getDate()))
                    .orElse(null);
            
            Milestone earliestAfter = otherMilestones.stream()
                    .filter(m -> m.getDate().isAfter(request.getDate()))
                    .min((m1, m2) -> m1.getDate().compareTo(m2.getDate()))
                    .orElse(null);
            
            if (earliestAfter != null) {
                throw new BadRequestException("New milestone date conflicts with later milestone (" + earliestAfter.getDate() + ")");
            }
            
            milestone.setDate(request.getDate());
        }
        if (request.getStatus() != null) {
            milestone.setStatus(request.getStatus());
        }
        Milestone saved = milestoneRepository.save(milestone);

        // Auto-update project status based on milestones
        updateProjectStatusBasedOnMilestones(projectId);

        if (request.getStatus() != null) {
            Long userId = getUserIdFromRequest();
            if (userId != null) {
                notify(userId, saved.getMilestoneId(),
                        "Milestone '" + saved.getTitle() + "' status updated to " + saved.getStatus() + ".",
                        NotificationCategory.PROJECT);
            }
        }
        return toMilestoneResponse(saved);
    }

    @Transactional
    public void deleteMilestone(Long milestoneId) {
        Milestone milestone = findMilestoneById(milestoneId);
        Long projectId = milestone.getProjectId();
        
        milestoneRepository.deleteById(milestoneId);
        
        // Auto-update project status after milestone deletion
        updateProjectStatusBasedOnMilestones(projectId);
    }

    // ─── Impact CRUD ──────────────────────────────────────────────

    @Transactional
    public ImpactResponse addOrUpdateImpact(Long projectId, ImpactRequest request) {
        findProjectById(projectId);
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElse(Impact.builder().projectId(projectId).build());

        impact.setMetrics(request.getMetrics());
        if (request.getStatus() != null) {
            impact.setStatus(request.getStatus());
        }
        return toImpactResponse(impactRepository.save(impact));
    }

    /**
     * Partially update predefined metric fields.
     * Only fields that are non-null in the request will be updated.
     * customMetrics entries in the request are MERGED into existing ones (not replaced).
     *
     * Example — pollution project adds treesPlanted later:
     *   PATCH /projects/1/impact/metrics
     *   { "treesPlanted": 200, "pollutionIncidentsResolved": 15 }
     */
    @Transactional
    public ImpactResponse patchMetrics(Long projectId, ImpactMetrics patch) {
        findProjectById(projectId);
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));

        ImpactMetrics existing = impact.getMetrics();
        if (existing == null) existing = new ImpactMetrics();

        // Predefined fields — only overwrite if non-null in patch
        if (patch.getTreesPlanted()                != null) existing.setTreesPlanted(patch.getTreesPlanted());
        if (patch.getAreaRestoredHectares()        != null) existing.setAreaRestoredHectares(patch.getAreaRestoredHectares());
        if (patch.getCo2ReducedTons()              != null) existing.setCo2ReducedTons(patch.getCo2ReducedTons());
        if (patch.getRenewableEnergyKwh()          != null) existing.setRenewableEnergyKwh(patch.getRenewableEnergyKwh());
        if (patch.getWasteCollectedKg()            != null) existing.setWasteCollectedKg(patch.getWasteCollectedKg());
        if (patch.getWaterBodiesCleaned()          != null) existing.setWaterBodiesCleaned(patch.getWaterBodiesCleaned());
        if (patch.getPollutionIncidentsResolved()  != null) existing.setPollutionIncidentsResolved(patch.getPollutionIncidentsResolved());
        if (patch.getPeopleBenefited()             != null) existing.setPeopleBenefited(patch.getPeopleBenefited());
        if (patch.getAwarenessSessionsConducted()  != null) existing.setAwarenessSessionsConducted(patch.getAwarenessSessionsConducted());
        if (patch.getVolunteerEngagements()        != null) existing.setVolunteerEngagements(patch.getVolunteerEngagements());
        if (patch.getNotes()                       != null) existing.setNotes(patch.getNotes());

        // Custom metrics — MERGE new entries into existing map
        if (patch.getCustomMetrics() != null && !patch.getCustomMetrics().isEmpty()) {
            if (existing.getCustomMetrics() == null) {
                existing.setCustomMetrics(new java.util.HashMap<>());
            }
            existing.getCustomMetrics().putAll(patch.getCustomMetrics());
        }

        impact.setMetrics(existing);
        return toImpactResponse(impactRepository.save(impact));
    }

    /**
     * Add or update individual custom metric entries (key-value pairs).
     * Merges into existing customMetrics — does not replace the whole map.
     *
     * Example — pollution project adds AQI readings:
     *   PATCH /projects/1/impact/metrics/custom
     *   { "aqiBefore": 180, "aqiAfter": 95, "treesPlantedNearFactory": 50 }
     */
    @Transactional
    public ImpactResponse addOrUpdateCustomMetrics(Long projectId, java.util.Map<String, Object> customEntries) {
        if (customEntries == null || customEntries.isEmpty()) {
            throw new BadRequestException("At least one custom metric key-value pair is required");
        }
        findProjectById(projectId);
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));

        ImpactMetrics metrics = impact.getMetrics();
        if (metrics == null) metrics = new ImpactMetrics();
        if (metrics.getCustomMetrics() == null) metrics.setCustomMetrics(new java.util.HashMap<>());

        metrics.getCustomMetrics().putAll(customEntries);
        impact.setMetrics(metrics);
        return toImpactResponse(impactRepository.save(impact));
    }

    /**
     * Remove a single custom metric key from an impact.
     *
     * Example: DELETE /projects/1/impact/metrics/custom/aqiBefore
     */
    @Transactional
    public ImpactResponse removeCustomMetric(Long projectId, String key) {
        findProjectById(projectId);
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));

        ImpactMetrics metrics = impact.getMetrics();
        if (metrics == null || metrics.getCustomMetrics() == null
                || !metrics.getCustomMetrics().containsKey(key)) {
            throw new ResourceNotFoundException("Custom metric key not found: " + key);
        }

        metrics.getCustomMetrics().remove(key);
        impact.setMetrics(metrics);
        return toImpactResponse(impactRepository.save(impact));
    }

    public ImpactResponse getImpactById(Long impactId) {
        return toImpactResponse(impactRepository.findById(impactId)
                .orElseThrow(() -> new ResourceNotFoundException("Impact", impactId)));
    }

    public ImpactResponse getImpactByProject(Long projectId) {
        findProjectById(projectId); // validate project exists
        return impactRepository.findByProjectId(projectId)
                .map(this::toImpactResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));
    }

    public List<ImpactResponse> getImpactsByStatus(ImpactStatus status) {
        if (status == null) throw new BadRequestException("Status is required");
        return impactRepository.findByStatus(status).stream()
                .map(this::toImpactResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ImpactResponse updateImpactStatus(Long projectId, ImpactStatus status) {
        findProjectById(projectId);
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));
        impact.setStatus(status);
        Impact saved = impactRepository.save(impact);
        Long userId = getUserIdFromRequest();
        if (userId != null) {
            notify(userId, saved.getImpactId(),
                    "Impact status for project #" + projectId + " updated to " + status + ".",
                    NotificationCategory.PROJECT);
        }
        return toImpactResponse(saved);
    }

    @Transactional
    public void deleteImpact(Long projectId) {
        findProjectById(projectId);
        impactRepository.findByProjectId(projectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Impact not found for project: " + projectId));
        impactRepository.deleteByProjectId(projectId);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private void notify(Long userId, Long entityId, String message, NotificationCategory category) {
        try {
            notificationClient.createNotification(
                    NotificationRequest.builder()
                            .userId(userId)
                            .entityId(entityId)
                            .message(message)
                            .category(category)
                            .build());
        } catch (Exception e) {
            log.warn("Failed to send notification to userId={}: {}", userId, e.getMessage());
        }
    }

    private Long getUserIdFromRequest() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String userId = attrs.getRequest().getHeader("X-User-Id");
                if (userId != null && !userId.isBlank()) {
                    return Long.parseLong(userId);
                }
            }
        } catch (Exception e) {
            log.warn("Could not extract X-User-Id from request context: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Auto-update project status based on milestone conditions:
     * - If project has incomplete milestones → IN_PROGRESS
     * - If progress % is 100 (all milestones COMPLETED) → COMPLETED
     * - If new milestone added and progress % != 100 → IN_PROGRESS
     */
    private void updateProjectStatusBasedOnMilestones(Long projectId) {
        List<Milestone> milestones = milestoneRepository.findByProjectId(projectId);
        
        if (milestones.isEmpty()) {
            // No milestones - keep current status (usually PLANNED)
            return;
        }
        
        Project project = findProjectById(projectId);
        ProjectStatus currentStatus = project.getStatus();
        
        // Calculate progress percentage
        long totalMilestones = milestones.size();
        long completedMilestones = milestones.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.COMPLETED)
                .count();
        
        int progressPercent = (int) Math.round((completedMilestones * 100.0) / totalMilestones);
        
        ProjectStatus newStatus;
        
        if (progressPercent == 100) {
            // All milestones completed - project is COMPLETED
            newStatus = ProjectStatus.COMPLETED;
        } else if (progressPercent > 0 || totalMilestones > 0) {
            // Has milestones and some work started - project is IN_PROGRESS
            newStatus = ProjectStatus.IN_PROGRESS;
        } else {
            // No progress yet - keep current status
            return;
        }
        
        // Only update if status actually changes
        if (currentStatus != newStatus) {
            project.setStatus(newStatus);
            projectRepository.save(project);
            log.info("Project {} status auto-updated from {} to {} (progress: {}%)", 
                    projectId, currentStatus, newStatus, progressPercent);
        }
    }

    private Project findProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ProjectNotFoundException(id));
    }

    private Milestone findMilestoneById(Long id) {
        return milestoneRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone", id));
    }

    // ─── Mappers ─────────────────────────────────────────────────

    private ProjectResponse toProjectResponse(Project p) {
        return ProjectResponse.builder()
                .projectId(p.getProjectId())
                .title(p.getTitle())
                .description(p.getDescription())
                .startDate(p.getStartDate())
                .endDate(p.getEndDate())
                .budget(p.getBudget())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .updatedAt(p.getUpdatedAt())
                .build();
    }

    private MilestoneResponse toMilestoneResponse(Milestone m) {
        return MilestoneResponse.builder()
                .milestoneId(m.getMilestoneId())
                .projectId(m.getProjectId())
                .title(m.getTitle())
                .description(m.getDescription())
                .date(m.getDate())
                .status(m.getStatus())
                .createdAt(m.getCreatedAt())
                .updatedAt(m.getUpdatedAt())
                .build();
    }

    private ImpactResponse toImpactResponse(Impact i) {
        return ImpactResponse.builder()
                .impactId(i.getImpactId())
                .projectId(i.getProjectId())
                .metrics(i.getMetrics())
                .date(i.getDate())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}

