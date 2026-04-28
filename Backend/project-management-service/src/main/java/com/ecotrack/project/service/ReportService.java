package com.ecotrack.project.service;

import com.ecotrack.project.dto.ReportRequest;
import com.ecotrack.project.dto.ReportResponse;
import com.ecotrack.project.entity.Report;
import com.ecotrack.project.enums.ReportScope;
import com.ecotrack.project.exception.ResourceNotFoundException;
import com.ecotrack.project.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ReportRepository reportRepository;

    @Transactional
    public ReportResponse createReport(ReportRequest request) {
        Report report = Report.builder()
                .scope(request.getScope())
                .metrics(request.getMetrics())
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

    @Transactional
    public void deleteReport(Long id) {
        if (!reportRepository.existsById(id)) throw new ResourceNotFoundException("Report", id);
        reportRepository.deleteById(id);
    }

    private ReportResponse toResponse(Report r) {
        return ReportResponse.builder()
                .reportId(r.getReportId()).scope(r.getScope()).metrics(r.getMetrics())
                .generatedDate(r.getGeneratedDate()).createdAt(r.getCreatedAt()).build();
    }
}

