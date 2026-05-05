package com.ecotrack.compliance.controller;

import com.ecotrack.compliance.dto.*;
import com.ecotrack.compliance.enums.AuditStatus;
import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import com.ecotrack.compliance.service.ComplianceService;
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
@RequiredArgsConstructor
@Tag(name = "Compliance & Audit", description = "Compliance record and audit management APIs")
public class ComplianceController {

    private final ComplianceService complianceService;

    @PostMapping("/api/v1/compliance")
    @Operation(summary = "Create a compliance record")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ComplianceRecordResponse> create(@Valid @RequestBody ComplianceRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complianceService.createRecord(request));
    }

    @GetMapping("/api/v1/compliance")
    @Operation(summary = "Get all compliance records")
    public ResponseEntity<List<ComplianceRecordResponse>> getAll() {
        return ResponseEntity.ok(complianceService.getAllRecords());
    }

    @GetMapping("/api/v1/compliance/{id}")
    @Operation(summary = "Get compliance record by ID")
    public ResponseEntity<ComplianceRecordResponse> getById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(complianceService.getRecordById(id));
    }

    @GetMapping("/api/v1/compliance/entity/{entityId}")
    @Operation(summary = "Get compliance records by entity ID")
    public ResponseEntity<List<ComplianceRecordResponse>> getByEntity(@PathVariable("entityId") Long entityId) {
        return ResponseEntity.ok(complianceService.getByEntityId(entityId));
    }

    @GetMapping("/api/v1/compliance/type/{type}")
    @Operation(summary = "Get compliance records by type")
    public ResponseEntity<List<ComplianceRecordResponse>> getByType(@PathVariable("type") ComplianceType type) {
        return ResponseEntity.ok(complianceService.getByType(type));
    }

    @GetMapping("/api/v1/compliance/result/{result}")
    @Operation(summary = "Get compliance records by result")
    public ResponseEntity<List<ComplianceRecordResponse>> getByResult(@PathVariable("result") ComplianceResult result) {
        return ResponseEntity.ok(complianceService.getByResult(result));
    }

    @PatchMapping("/api/v1/compliance/{id}")
    @Operation(summary = "Update compliance record result and notes")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<ComplianceRecordResponse> update(@PathVariable("id") Long id,
                                                            @RequestParam("result") ComplianceResult result,
                                                            @RequestParam(name = "notes", required = false) String notes) {
        return ResponseEntity.ok(complianceService.updateRecord(id, result, notes));
    }

    @DeleteMapping("/api/v1/compliance/{id}")
    @Operation(summary = "Delete a compliance record")
    @PreAuthorize("hasAnyAuthority('ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable("id") Long id) {
        complianceService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/v1/audits")
    @Operation(summary = "Create an audit")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<AuditResponse> createAudit(@Valid @RequestBody AuditRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(complianceService.createAudit(request));
    }

    @GetMapping("/api/v1/audits")
    @Operation(summary = "Get all audits")
    public ResponseEntity<List<AuditResponse>> getAllAudits() {
        return ResponseEntity.ok(complianceService.getAllAudits());
    }

    @GetMapping("/api/v1/audits/{id}")
    @Operation(summary = "Get audit by ID")
    public ResponseEntity<AuditResponse> getAudit(@PathVariable("id") Long id) {
        return ResponseEntity.ok(complianceService.getAuditById(id));
    }

    @GetMapping("/api/v1/audits/officer/{officerId}")
    @Operation(summary = "Get audits by officer ID")
    public ResponseEntity<List<AuditResponse>> getByOfficer(@PathVariable("officerId") Long officerId) {
        return ResponseEntity.ok(complianceService.getAuditsByOfficer(officerId));
    }

    @PatchMapping("/api/v1/audits/{id}/status")
    @Operation(summary = "Update audit status and findings")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMINISTRATOR','SUPER_ADMIN')")
    public ResponseEntity<AuditResponse> updateStatus(@PathVariable("id") Long id,
                                                       @RequestParam("status") AuditStatus status,
                                                       @RequestParam(name = "findings", required = false) String findings) {
        return ResponseEntity.ok(complianceService.updateAuditStatus(id, status, findings));
    }
}
