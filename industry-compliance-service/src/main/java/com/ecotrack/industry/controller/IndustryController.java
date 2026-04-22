package com.ecotrack.industry.controller;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.service.IndustryService;
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
@Tag(name = "Industry Emissions & Compliance", description = "Emission logging and document submission APIs")
public class IndustryController {

    private final IndustryService industryService;

    // ─── Emission Log Endpoints ───────────────────────────────────

    @PostMapping("/api/v1/emissions")
    @Operation(summary = "Log a new industry emission (status defaults to SUBMITTED)")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<EmissionLogResponse> logEmission(@Valid @RequestBody EmissionLogRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(industryService.logEmission(request));
    }

    @GetMapping("/api/v1/emissions")
    @Operation(summary = "Get all emission logs")
    public ResponseEntity<List<EmissionLogResponse>> getAllEmissions() {
        return ResponseEntity.ok(industryService.getAllEmissions());
    }

    @GetMapping("/api/v1/emissions/{id}")
    @Operation(summary = "Get emission log by ID")
    public ResponseEntity<EmissionLogResponse> getEmissionById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(industryService.getEmissionById(id));
    }

    @GetMapping("/api/v1/emissions/industry")
    @Operation(summary = "Get all emissions for a specific industry by name (supports spaces, e.g. ?industryName=Steel Industries)")
    public ResponseEntity<List<EmissionLogResponse>> getEmissionsByIndustryName(@RequestParam("industryName") String industryName) {
        return ResponseEntity.ok(industryService.getEmissionsByIndustryName(industryName));
    }


    @PatchMapping("/api/v1/emissions/{id}/status")
    @Operation(summary = "Update emission status (SUBMITTED→UNDER_REVIEW→APPROVED/REJECTED)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<EmissionLogResponse> updateEmissionStatus(@PathVariable("id") Long id,
                                                                     @RequestParam("status") EmissionStatus status) {
        return ResponseEntity.ok(industryService.updateEmissionStatus(id, status));
    }

    @DeleteMapping("/api/v1/emissions/{id}")
    @Operation(summary = "Delete an emission log by ID")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<Void> deleteEmission(@PathVariable("id") Long id) {
        industryService.deleteEmission(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Industry Document Endpoints ──────────────────────────────

    @PostMapping("/api/v1/industry-documents")
    @Operation(summary = "Submit a compliance document (status defaults to PENDING)")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> submitDocument(
            @Valid @RequestBody IndustryDocumentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(industryService.submitDocument(request));
    }

    @GetMapping("/api/v1/industry-documents")
    @Operation(summary = "Get all industry documents")
    public ResponseEntity<List<IndustryDocumentResponse>> getAllDocuments() {
        return ResponseEntity.ok(industryService.getAllDocuments());
    }

    @GetMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Get a document by its ID")
    public ResponseEntity<IndustryDocumentResponse> getDocumentById(@PathVariable("docId") Long docId) {
        return ResponseEntity.ok(industryService.getDocumentById(docId));
    }

    @GetMapping("/api/v1/industry-documents/industry")
    @Operation(summary = "Get all documents for a specific industry by name (supports spaces, e.g. ?industryName=Steel Industries)")
    public ResponseEntity<List<IndustryDocumentResponse>> getDocumentsByIndustryName(@RequestParam("industryName") String industryName) {
        return ResponseEntity.ok(industryService.getDocumentsByIndustryName(industryName));
    }


    @PatchMapping("/api/v1/industry-documents/{docId}/verify")
    @Operation(summary = "Verify or reject a document (PENDING→VERIFIED/REJECTED)")
    @PreAuthorize("hasAnyAuthority('OFFICER','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> verifyDocument(@PathVariable("docId") Long docId,
                                                                    @RequestParam("status") VerificationStatus status) {
        return ResponseEntity.ok(industryService.verifyDocument(docId, status));
    }

    @DeleteMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Delete a document by ID")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable("docId") Long docId) {
        industryService.deleteDocument(docId);
        return ResponseEntity.noContent().build();
    }
}
