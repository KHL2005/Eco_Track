package com.ecotrack.project.service;

import com.ecotrack.project.dto.ReportRequest;
import com.ecotrack.project.dto.ReportResponse;
import com.ecotrack.project.entity.Report;
import com.ecotrack.project.entity.Project;
import com.ecotrack.project.entity.Milestone;
import com.ecotrack.project.enums.ReportScope;
import com.ecotrack.project.enums.ReportType;
import com.ecotrack.project.exception.BadRequestException;
import com.ecotrack.project.exception.ResourceNotFoundException;
import com.ecotrack.project.repository.ReportRepository;
import com.ecotrack.project.repository.ProjectRepository;
import com.ecotrack.project.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        if (request.getScope() == null) {
            throw new BadRequestException("Scope is required");
        }
        
        String title = request.getTitle();
        String description = request.getDescription();
        String metrics = request.getMetrics();
        ReportType reportType = request.getReportType() != null ? request.getReportType() : ReportType.MANUAL;
        
        // Generate report for PROJECT scope
        if (request.getScope() == ReportScope.PROJECT) {
            if (request.getProjectId() == null) {
                throw new BadRequestException("Project ID is required for PROJECT scope");
            }
            
            // Validate uniqueness: Only one report should exist per project
            if (reportRepository.findByProjectIdAndScope(request.getProjectId(), ReportScope.PROJECT).isPresent()) {
                throw new BadRequestException("A report already exists for project #" + request.getProjectId() + 
                        ". Only one report is allowed per project. Please delete the existing report first.");
            }
            
            Project project = projectRepository.findById(request.getProjectId())
                    .orElseThrow(() -> new ResourceNotFoundException("Project", request.getProjectId()));
            
            // Auto-generate if not provided
            if (title == null || title.isBlank()) {
                title = "Project Report: " + project.getTitle();
            }
            if (description == null || description.isBlank()) {
                description = "Comprehensive report for project '" + project.getTitle() + "' (" + project.getStatus() + ")";
            }
            if (metrics == null || metrics.isBlank()) {
                metrics = generateProjectMetrics(project);
            }
        }
        // Generate report for ISSUE scope
        else if (request.getScope() == ReportScope.ISSUE) {
            if (request.getIssueId() == null) {
                throw new BadRequestException("Issue ID is required for ISSUE scope");
            }
            
            // Validate uniqueness: Only one report should exist per issue
            if (reportRepository.findByIssueIdAndScope(request.getIssueId(), ReportScope.ISSUE).isPresent()) {
                throw new BadRequestException("A report already exists for issue #" + request.getIssueId() + 
                        ". Only one report is allowed per issue. Please delete the existing report first.");
            }
            
            // Auto-generate if not provided
            if (title == null || title.isBlank()) {
                title = "Issue Report #" + request.getIssueId();
            }
            if (description == null || description.isBlank()) {
                description = "Detailed report for issue #" + request.getIssueId();
            }
            if (metrics == null || metrics.isBlank()) {
                metrics = generateIssueMetrics(request.getIssueId());
            }
        } else {
            // For other scopes, use provided metrics or generate default
            if (metrics == null || metrics.isBlank()) {
                metrics = "Report for scope: " + request.getScope();
            }
            if (title == null || title.isBlank()) {
                title = "Report - " + request.getScope();
            }
        }
        
        Report report = Report.builder()
                .scope(request.getScope())
                .reportType(reportType)
                .projectId(request.getProjectId())
                .issueId(request.getIssueId())
                .title(title)
                .description(description)
                .metrics(metrics)
                .build();
        return toResponse(reportRepository.save(report));
    }

    public List<ReportResponse> getAllReports() {
        return reportRepository.findAll().stream().map(this::toResponse).collect(Collectors.toList());
    }

    public ReportResponse getReportById(Long id) {
        return toResponse(reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report", id)));
    }

    public List<ReportResponse> getReportsByScope(ReportScope scope) {
        return reportRepository.findByScope(scope).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ReportResponse> getReportsByProjectId(Long projectId) {
        return reportRepository.findByProjectId(projectId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<ReportResponse> getReportsByIssueId(Long issueId) {
        return reportRepository.findByIssueId(issueId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id)) throw new ResourceNotFoundException("Report", id);
        reportRepository.deleteById(id);
    }

    private String generateProjectMetrics(Project project) {
        List<Milestone> milestones = milestoneRepository.findByProjectId(project.getProjectId());
        
        StringBuilder sb = new StringBuilder();
        sb.append("PROJECT REPORT\n");
        sb.append("==============\n\n");
        
        sb.append("Project Title: ").append(project.getTitle()).append("\n");
        sb.append("Status: ").append(project.getStatus()).append("\n");
        sb.append("Start Date: ").append(project.getStartDate()).append("\n");
        if (project.getEndDate() != null) {
            sb.append("End Date: ").append(project.getEndDate()).append("\n");
        }
        if (project.getBudget() != null) {
            sb.append("Budget: ₹ ").append(String.format("%,.2f", project.getBudget())).append("\n");
        }
        
        if (project.getDescription() != null && !project.getDescription().isBlank()) {
            sb.append("\nDescription:\n").append(project.getDescription()).append("\n");
        }
        
        if (!milestones.isEmpty()) {
            sb.append("\nMilestones (").append(milestones.size()).append("):\n");
            for (Milestone m : milestones) {
                sb.append("  - ").append(m.getTitle()).append(" [").append(m.getStatus()).append("] - ").append(m.getDate()).append("\n");
            }
            
            long completedCount = milestones.stream().filter(m -> m.getStatus().name().equals("COMPLETED")).count();
            int progress = (int) Math.round((completedCount * 100.0) / milestones.size());
            sb.append("\nOverall Progress: ").append(progress).append("%\n");
        }
        
        sb.append("\nReport Generated: ").append(LocalDate.now()).append("\n");
        
        return sb.toString();
    }

    private String generateIssueMetrics(Long issueId) {
        StringBuilder sb = new StringBuilder();
        sb.append("ISSUE REPORT\n");
        sb.append("=============\n\n");
        
        sb.append("Issue ID: #").append(issueId).append("\n");
        sb.append("Report Type: Issue Investigation & Analysis\n");
        sb.append("Report Generated: ").append(LocalDate.now()).append("\n\n");
        
        sb.append("Issue Analysis Summary:\n");
        sb.append("This report provides a detailed analysis of the reported environmental issue.\n");
        sb.append("The issue has been logged and is under investigation by the agency officers.\n\n");
        
        sb.append("Next Steps:\n");
        sb.append("- Field investigation scheduled\n");
        sb.append("- Evidence collection in progress\n");
        sb.append("- Remedial action plan to be determined\n\n");
        
        sb.append("For more details, please contact the Environmental Agency.\n");
        
        return sb.toString();
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .reportId(r.getReportId())
                .scope(r.getScope())
                .reportType(r.getReportType())
                .projectId(r.getProjectId())
                .issueId(r.getIssueId())
                .title(r.getTitle())
                .description(r.getDescription())
                .metrics(r.getMetrics())
                .generatedDate(r.getGeneratedDate())
                .createdAt(r.getCreatedAt())
                .build();
    }
}

