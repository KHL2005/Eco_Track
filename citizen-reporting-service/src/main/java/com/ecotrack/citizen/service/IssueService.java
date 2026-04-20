package com.ecotrack.citizen.service;

import com.ecotrack.citizen.dto.*;
import com.ecotrack.citizen.entity.Issue;
import com.ecotrack.citizen.entity.Resolution;
import com.ecotrack.citizen.enums.IssueStatus;
import com.ecotrack.citizen.enums.IssueType;
import com.ecotrack.citizen.enums.ResolutionStatus;
import com.ecotrack.citizen.exception.BadRequestException;
import com.ecotrack.citizen.exception.DuplicateResourceException;
import com.ecotrack.citizen.exception.IssueNotFoundException;
import com.ecotrack.citizen.exception.ResourceNotFoundException;
import com.ecotrack.citizen.kafka.EventProducer;
import com.ecotrack.citizen.repository.IssueRepository;
import com.ecotrack.citizen.repository.ResolutionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IssueService {

    private final IssueRepository issueRepository;
    private final ResolutionRepository resolutionRepository;
    private final EventProducer eventProducer;

    // ─── Issue CRUD ───────────────────────────────────────────────

    @Transactional
    public IssueResponse createIssue(IssueRequest request) {
        Issue issue = Issue.builder()
                .citizenId(request.getCitizenId())
                .type(request.getType())
                .location(request.getLocation())
                .description(request.getDescription())
                .status(IssueStatus.OPEN)
                .build();
        issue = issueRepository.save(issue);

        // Publish async Kafka event — does not affect response
        try {
            eventProducer.publishIssueCreated(issue.getCitizenId(), issue.getIssueId(), issue.getLocation());
        } catch (Exception e) {
            log.warn("Kafka publish failed for issueId={}: {}", issue.getIssueId(), e.getMessage());
        }

        return toIssueResponse(issue);
    }

    public IssueResponse getIssueById(Long id) {
        return toIssueResponse(findIssueById(id));
    }

    public List<IssueResponse> getAllIssues() {
        return issueRepository.findAll().stream()
                .map(this::toIssueResponse)
                .collect(Collectors.toList());
    }

    public List<IssueResponse> getIssuesByCitizen(Long citizenId) {
        if (citizenId == null) {
            throw new BadRequestException("Citizen ID is required");
        }
        return issueRepository.findByCitizenId(citizenId).stream()
                .map(this::toIssueResponse)
                .collect(Collectors.toList());
    }

    public List<IssueResponse> getIssuesByStatus(IssueStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        return issueRepository.findByStatus(status).stream()
                .map(this::toIssueResponse)
                .collect(Collectors.toList());
    }

    public List<IssueResponse> getIssuesByType(IssueType type) {
        if (type == null) {
            throw new BadRequestException("Issue type is required");
        }
        return issueRepository.findByType(type).stream()
                .map(this::toIssueResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public IssueResponse updateIssue(Long id, IssueRequest request) {
        Issue issue = findIssueById(id);
        // Partial update — only update provided fields
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            issue.setLocation(request.getLocation());
        }
        if (request.getDescription() != null) {
            issue.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            issue.setType(request.getType());
        }
        return toIssueResponse(issueRepository.save(issue));
    }

    @Transactional
    public IssueResponse updateIssueStatus(Long id, IssueStatusUpdateRequest request) {
        Issue issue = findIssueById(id);
        validateStatusTransition(issue.getStatus(), request.getStatus());
        issue.setStatus(request.getStatus());
        return toIssueResponse(issueRepository.save(issue));
    }

    @Transactional
    public void deleteIssue(Long id) {
        findIssueById(id); // validates existence, throws IssueNotFoundException
        // Delete linked resolution first to avoid FK constraint violation
        resolutionRepository.findByIssueId(id)
                .ifPresent(r -> resolutionRepository.deleteById(r.getResolutionId()));
        issueRepository.deleteById(id);
        log.info("Issue {} and linked resolution deleted", id);
    }

    // ─── Resolution CRUD ─────────────────────────────────────────

    @Transactional
    public ResolutionResponse addResolution(ResolutionRequest request) {
        Issue issue = findIssueById(request.getIssueId());

        if (resolutionRepository.existsByIssueId(request.getIssueId())) {
            throw new DuplicateResourceException(
                    "Resolution already exists for issue: " + request.getIssueId());
        }

        Resolution resolution = Resolution.builder()
                .issueId(request.getIssueId())
                .officerId(request.getOfficerId())
                .actions(request.getActions())
                .status(ResolutionStatus.PENDING)
                .build();

        resolution = resolutionRepository.save(resolution);

        // Auto-progress issue status when resolution is added
        if (issue.getStatus() == IssueStatus.OPEN) {
            issue.setStatus(IssueStatus.IN_PROGRESS);
            issueRepository.save(issue);
        }

        return toResolutionResponse(resolution);
    }

    public ResolutionResponse getResolutionByIssue(Long issueId) {
        findIssueById(issueId); // validate issue exists first
        return resolutionRepository.findByIssueId(issueId)
                .map(this::toResolutionResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Resolution not found for issue: " + issueId));
    }

    public ResolutionResponse getResolutionById(Long resolutionId) {
        return toResolutionResponse(resolutionRepository.findById(resolutionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resolution", resolutionId)));
    }

    public List<ResolutionResponse> getAllResolutions() {
        return resolutionRepository.findAll().stream()
                .map(this::toResolutionResponse)
                .collect(Collectors.toList());
    }

    public List<ResolutionResponse> getResolutionsByOfficer(Long officerId) {
        if (officerId == null) {
            throw new BadRequestException("Officer ID is required");
        }
        return resolutionRepository.findByOfficerId(officerId).stream()
                .map(this::toResolutionResponse)
                .collect(Collectors.toList());
    }

    public List<ResolutionResponse> getResolutionsByStatus(ResolutionStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        return resolutionRepository.findByStatus(status).stream()
                .map(this::toResolutionResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ResolutionResponse updateResolution(Long resolutionId, ResolutionStatusUpdateRequest request) {
        Resolution resolution = resolutionRepository.findById(resolutionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resolution", resolutionId));

        resolution.setStatus(request.getStatus());
        if (request.getActions() != null && !request.getActions().isBlank()) {
            resolution.setActions(request.getActions());
        }

        resolution = resolutionRepository.save(resolution);

        // Auto-update issue status based on resolution completion
        if (request.getStatus() == ResolutionStatus.COMPLETED) {
            issueRepository.findById(resolution.getIssueId()).ifPresent(issue -> {
                if (issue.getStatus() != IssueStatus.CLOSED) {
                    issue.setStatus(IssueStatus.RESOLVED);
                    issueRepository.save(issue);
                }
            });
        }

        return toResolutionResponse(resolution);
    }

    @Transactional
    public void deleteResolution(Long resolutionId) {
        Resolution resolution = resolutionRepository.findById(resolutionId)
                .orElseThrow(() -> new ResourceNotFoundException("Resolution", resolutionId));

        // Revert issue status back to OPEN when resolution is removed
        issueRepository.findById(resolution.getIssueId()).ifPresent(issue -> {
            if (issue.getStatus() == IssueStatus.IN_PROGRESS) {
                issue.setStatus(IssueStatus.OPEN);
                issueRepository.save(issue);
            }
        });

        resolutionRepository.deleteById(resolutionId);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private Issue findIssueById(Long id) {
        return issueRepository.findById(id)
                .orElseThrow(() -> new IssueNotFoundException(id));
    }

    private void validateStatusTransition(IssueStatus current, IssueStatus next) {
        if (current == next) {
            throw new BadRequestException("Issue is already in status: " + current);
        }
        boolean valid = switch (current) {
            case OPEN       -> next == IssueStatus.IN_PROGRESS || next == IssueStatus.CLOSED;
            case IN_PROGRESS-> next == IssueStatus.RESOLVED || next == IssueStatus.CLOSED;
            case RESOLVED   -> next == IssueStatus.CLOSED;
            case CLOSED     -> false;
        };
        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition from " + current + " to " + next +
                    ". Allowed: " + allowedTransitions(current));
        }
    }

    private String allowedTransitions(IssueStatus current) {
        return switch (current) {
            case OPEN        -> "IN_PROGRESS, CLOSED";
            case IN_PROGRESS -> "RESOLVED, CLOSED";
            case RESOLVED    -> "CLOSED";
            case CLOSED      -> "none (terminal state)";
        };
    }

    // ─── Mappers ─────────────────────────────────────────────────

    private IssueResponse toIssueResponse(Issue issue) {
        return IssueResponse.builder()
                .issueId(issue.getIssueId())
                .citizenId(issue.getCitizenId())
                .type(issue.getType())
                .location(issue.getLocation())
                .description(issue.getDescription())
                .date(issue.getDate())
                .status(issue.getStatus())
                .createdAt(issue.getCreatedAt())
                .updatedAt(issue.getUpdatedAt())
                .build();
    }

    private ResolutionResponse toResolutionResponse(Resolution r) {
        return ResolutionResponse.builder()
                .resolutionId(r.getResolutionId())
                .issueId(r.getIssueId())
                .officerId(r.getOfficerId())
                .actions(r.getActions())
                .date(r.getDate())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}

