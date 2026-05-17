package com.ecotrack.industry.controller;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.service.IndustryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Industry Emissions & Compliance", description = "Emission logging and document submission APIs")
public class IndustryController {

    private final IndustryService industryService;

    // ─── Emission Log Endpoints ───────────────────────────────────────────────

    @PostMapping("/api/v1/emissions")
    @Operation(summary = "Log a new industry emission (status defaults to SUBMITTED)")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<EmissionLogResponse> logEmission(
            @RequestBody @Valid EmissionLogRequest request,
            @RequestHeader(value = "X-User-Id", required = false) Long industryUserId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(industryService.logEmission(request, industryUserId));
    }

    @GetMapping("/api/v1/emissions")
    @Operation(summary = "Get all emission logs")
    public ResponseEntity<List<EmissionLogResponse>> getAllEmissions(
            @RequestHeader(value = "X-User-Id",   required = false) Long callerId,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole) {
        return ResponseEntity.ok(industryService.getAllEmissions(callerId, callerRole));
    }

    @GetMapping("/api/v1/emissions/{id}")
    @Operation(summary = "Get emission log by ID")
    public ResponseEntity<EmissionLogResponse> getEmissionById(@PathVariable Long id) {
        return ResponseEntity.ok(industryService.getEmissionById(id));
    }

    @GetMapping("/api/v1/emissions/industry")
    @Operation(summary = "Get all emissions by industry name")
    public ResponseEntity<List<EmissionLogResponse>> getEmissionsByIndustryName(
            @RequestParam("industryName") String industryName) {
        return ResponseEntity.ok(industryService.getEmissionsByIndustryName(industryName));
    }

    @PatchMapping("/api/v1/emissions/{id}/status")
    @Operation(summary = "Update emission status (SUBMITTED → APPROVED / REJECTED). Reason is required when status is REJECTED.")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMIN')")
    public ResponseEntity<EmissionLogResponse> updateEmissionStatus(
            @PathVariable Long id,
            @RequestParam("status") EmissionStatus status,
            @RequestParam(value = "rejectionReason", required = false) String rejectionReason) {
        return ResponseEntity.ok(industryService.updateEmissionStatus(id, status, rejectionReason));
    }

    @DeleteMapping("/api/v1/emissions/{id}")
    @Operation(summary = "Delete an emission log by ID")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<Void> deleteEmission(@PathVariable Long id) {
        industryService.deleteEmission(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Industry Document Endpoints ──────────────────────────────────────────

    /**
     * POST /api/v1/industry-documents  — multipart/form-data
     * Stores file on local filesystem; saves metadata + disk path in MySQL.
     * Returns JSON where fileUri = "/api/v1/industry-documents/{id}?download=true"
     */
    @PostMapping(value = "/api/v1/industry-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit compliance document + upload file (PDF/PNG/JPG, max 10 MB)")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> submitDocument(
            @ModelAttribute @Valid IndustryDocumentRequest request,
            @RequestParam("file")                          MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Long industryUserId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(industryService.submitDocument(request, file, industryUserId));
    }

    @GetMapping("/api/v1/industry-documents")
    @Operation(summary = "Get all industry documents (JSON metadata list)")
    public ResponseEntity<List<IndustryDocumentResponse>> getAllDocuments(
            @RequestHeader(value = "X-User-Id",   required = false) Long callerId,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole) {
        return ResponseEntity.ok(industryService.getAllDocuments(callerId, callerRole));
    }

    /**
     * GET /api/v1/industry-documents/{docId}
     *   (no params)    → JSON metadata
     *   ?view=true     → stream file inline  (browser renders it)
     *   ?download=true → stream file as attachment download
     */
    @GetMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Get JSON metadata OR stream file. Use ?download=true to download, ?view=true to view inline.")
    public ResponseEntity<?> getDocumentById(
            @PathVariable Long docId,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download,
            @RequestParam(value = "view",     required = false, defaultValue = "false") boolean view) {

        if (download || view) {
            DownloadPayload payload = industryService.getFileForDocument(docId);
            String ct = payload.contentType() != null
                    ? payload.contentType()
                    : MediaType.APPLICATION_OCTET_STREAM_VALUE;
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(ct))
                    .contentLength(payload.fileSize() != null ? payload.fileSize() : -1L)
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            ContentDisposition.builder(view ? "inline" : "attachment")
                                              .filename(payload.originalFilename())
                                              .build().toString())
                    .body((Resource) payload.resource());
        }

        return ResponseEntity.ok(industryService.getDocumentById(docId));
    }

    @GetMapping("/api/v1/industry-documents/industry")
    @Operation(summary = "Get all documents for a specific industry by name")
    public ResponseEntity<List<IndustryDocumentResponse>> getDocumentsByIndustryName(
            @RequestParam("industryName") String industryName) {
        return ResponseEntity.ok(industryService.getDocumentsByIndustryName(industryName));
    }

    @PatchMapping("/api/v1/industry-documents/{docId}/verify")
    @Operation(summary = "Verify or reject a document (SUBMITTED → APPROVED / REJECTED). Reason is required when status is REJECTED.")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> verifyDocument(
            @PathVariable Long docId,
            @RequestParam("status") VerificationStatus status,
            @RequestParam(value = "rejectionReason", required = false) String rejectionReason) {
        return ResponseEntity.ok(industryService.verifyDocument(docId, status, rejectionReason));
    }

    /**
     * DELETE /api/v1/industry-documents/{docId}
     * Deletes BOTH MySQL metadata AND the file from the local filesystem.
     */
    @DeleteMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Delete document metadata + its file from disk in one call")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        industryService.deleteDocument(docId);
        return ResponseEntity.noContent().build();
    }
}
