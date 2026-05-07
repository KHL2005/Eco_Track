package com.ecotrack.project.controller;

import com.ecotrack.project.dto.ReportRequest;
import com.ecotrack.project.dto.ReportResponse;
import com.ecotrack.project.enums.ReportScope;
import com.ecotrack.project.service.ReportService;
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
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Tag(name = "Reporting & Analytics", description = "Report generation and retrieval APIs")
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    @Operation(summary = "Generate a new report")
    @PreAuthorize("hasAnyAuthority('AGENCY_OFFICER','ADMINISTRATOR')")
    public ResponseEntity<ReportResponse> createReport(@Valid @RequestBody ReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reportService.createReport(request));
    }

    @GetMapping
    @Operation(summary = "Get all reports")
    public ResponseEntity<List<ReportResponse>> getAllReports() {
        return ResponseEntity.ok(reportService.getAllReports());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get report by ID")
    public ResponseEntity<ReportResponse> getReport(@PathVariable("id") Long id) {
        return ResponseEntity.ok(reportService.getReportById(id));
    }

    @GetMapping("/scope/{scope}")
    @Operation(summary = "Get reports by scope")
    public ResponseEntity<List<ReportResponse>> getByScope(@PathVariable("scope") ReportScope scope) {
        return ResponseEntity.ok(reportService.getReportsByScope(scope));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a report")
    @PreAuthorize("hasAuthority('ADMINISTRATOR')")
    public ResponseEntity<Void> deleteReport(@PathVariable("id") Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
