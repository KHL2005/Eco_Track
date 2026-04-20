package com.ecotrack.project.service;

import com.ecotrack.project.dto.*;
import com.ecotrack.project.entity.*;
import com.ecotrack.project.enums.*;
import com.ecotrack.project.exception.BadRequestException;
import com.ecotrack.project.exception.ProjectNotFoundException;
import com.ecotrack.project.exception.ResourceNotFoundException;
import com.ecotrack.project.kafka.EventProducer;
import com.ecotrack.project.repository.*;
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
    private final EventProducer eventProducer;

    // ─── Project CRUD ─────────────────────────────────────────────

    @Transactional
    public ProjectResponse createProject(ProjectRequest request) {
        if (request.getEndDate() != null && request.getStartDate() != null
                && request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date cannot be before start date");
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
        // Publish async Kafka event — does not affect response
        try {
            eventProducer.publishProjectCreated(project.getProjectId(), project.getTitle());
        } catch (Exception e) {
            log.warn("Kafka publish failed for projectId={}: {}", project.getProjectId(), e.getMessage());
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
        findProjectById(projectId); // validates project exists, throws ProjectNotFoundException
        Milestone milestone = Milestone.builder()
                .projectId(projectId)
                .title(request.getTitle())
                .date(request.getDate())
                .status(request.getStatus() != null ? request.getStatus() : MilestoneStatus.PENDING)
                .build();
        return toMilestoneResponse(milestoneRepository.save(milestone));
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
        // Partial update — only update provided fields
        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            milestone.setTitle(request.getTitle());
        }
        if (request.getDate() != null) {
            milestone.setDate(request.getDate());
        }
        if (request.getStatus() != null) {
            milestone.setStatus(request.getStatus());
        }
        Milestone saved = milestoneRepository.save(milestone);
        // Publish async event when milestone is marked COMPLETED
        if (MilestoneStatus.COMPLETED.equals(saved.getStatus())) {
            try {
                eventProducer.publishMilestoneCompleted(
                        saved.getProjectId(), saved.getMilestoneId(), saved.getTitle());
            } catch (Exception e) {
                log.warn("Kafka publish failed for milestoneId={}: {}", saved.getMilestoneId(), e.getMessage());
            }
        }
        return toMilestoneResponse(saved);
    }

    @Transactional
    public void deleteMilestone(Long milestoneId) {
        findMilestoneById(milestoneId); // validates existence
        milestoneRepository.deleteById(milestoneId);
    }

    // ─── Impact CRUD ──────────────────────────────────────────────

    @Transactional
    public ImpactResponse addOrUpdateImpact(Long projectId, ImpactRequest request) {
        findProjectById(projectId); // validates project exists, throws ProjectNotFoundException
        Impact impact = impactRepository.findByProjectId(projectId)
                .orElse(Impact.builder().projectId(projectId).build());

        impact.setMetricsJson(request.getMetricsJson());
        if (request.getStatus() != null) {
            impact.setStatus(request.getStatus());
        }
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
        return toImpactResponse(impactRepository.save(impact));
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
                .metricsJson(i.getMetricsJson())
                .date(i.getDate())
                .status(i.getStatus())
                .createdAt(i.getCreatedAt())
                .updatedAt(i.getUpdatedAt())
                .build();
    }
}

