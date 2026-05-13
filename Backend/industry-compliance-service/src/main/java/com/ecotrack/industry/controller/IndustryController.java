package com.ecotrack.industry.controller;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.service.IndustryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

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
    @Operation(summary = "Update emission status (SUBMITTED → APPROVED / REJECTED)")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMIN')")
    public ResponseEntity<EmissionLogResponse> updateEmissionStatus(
            @PathVariable Long id, @RequestParam("status") EmissionStatus status) {
        return ResponseEntity.ok(industryService.updateEmissionStatus(id, status));
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
     *
     * Form fields:
     *   industryId   (Long)
     *   industryName (String)
     *   docType      (PERMIT | COMPLIANCE | OTHERS)
     *   description  (String, optional)
     *   file         (PDF, max 10 MB)
     *
     * Stores metadata in MySQL and PDF in MongoDB GridFS.
     * Returns JSON where fileUri = "/api/v1/industry-documents/{id}?view=true"
     */
    @PostMapping(value = "/api/v1/industry-documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit compliance document + upload PDF in one request (max 10 MB)")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> submitDocument(
            @ModelAttribute @Valid IndustryDocumentRequest request,
            @RequestParam("file")                          MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Long industryUserId) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(industryService.submitDocument(request, file, industryUserId));
    }

    /**
     * GET /api/v1/industry-documents
     * Returns JSON list — each item has fileUri pointing to its PDF view URL.
     */
    @GetMapping("/api/v1/industry-documents")
    @Operation(summary = "Get all industry documents (JSON metadata list)")
    public ResponseEntity<List<IndustryDocumentResponse>> getAllDocuments(
            @RequestHeader(value = "X-User-Id",   required = false) Long callerId,
            @RequestHeader(value = "X-User-Role", required = false) String callerRole) {
        return ResponseEntity.ok(industryService.getAllDocuments(callerId, callerRole));
    }

    /**
     * GET /api/v1/industry-documents/{docId}
     *   (no params)       → JSON metadata
     *   ?view=true        → stream PDF inline  (browser renders it)
     *   ?download=true    → stream PDF as file download
     */
    @GetMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Get JSON metadata OR stream PDF. Use ?download=true to download, ?view=true to view inline.")
    public ResponseEntity<?> getDocumentById(
            @PathVariable Long docId,
            @RequestParam(value = "download", required = false, defaultValue = "false") boolean download,
            @RequestParam(value = "view",     required = false, defaultValue = "false") boolean view) {

        if (download || view) {
            Map<String, Object> pdf = industryService.getPdfForDocument(docId);
            byte[] data        = (byte[])  pdf.get("data");
            String fileName    = (String)  pdf.get("fileName");
            String contentType = (String)  pdf.get("contentType");
            long   fileSize    = (long)    pdf.get("fileSize");

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(contentType));
            headers.setContentLength(fileSize);
            headers.setContentDisposition(
                    ContentDisposition.builder(view ? "inline" : "attachment")
                                      .filename(fileName)
                                      .build());
            return new ResponseEntity<>(data, headers, HttpStatus.OK);
        }

        return ResponseEntity.ok(industryService.getDocumentById(docId));
    }

    /**
     * GET /api/v1/industry-documents/industry?industryName=Steel Industries
     * Returns JSON list for the given industry.
     */
    @GetMapping("/api/v1/industry-documents/industry")
    @Operation(summary = "Get all documents for a specific industry by name")
    public ResponseEntity<List<IndustryDocumentResponse>> getDocumentsByIndustryName(
            @RequestParam("industryName") String industryName) {
        return ResponseEntity.ok(industryService.getDocumentsByIndustryName(industryName));
    }

    @PatchMapping("/api/v1/industry-documents/{docId}/verify")
    @Operation(summary = "Verify or reject a document (SUBMITTED → APPROVED / REJECTED)")
    @PreAuthorize("hasAnyAuthority('COMPLIANCE_OFFICER','ADMIN')")
    public ResponseEntity<IndustryDocumentResponse> verifyDocument(
            @PathVariable Long docId, @RequestParam("status") VerificationStatus status) {
        return ResponseEntity.ok(industryService.verifyDocument(docId, status));
    }

    /**
     * DELETE /api/v1/industry-documents/{docId}
     * Deletes BOTH MySQL metadata AND the PDF from MongoDB GridFS.
     */
    @DeleteMapping("/api/v1/industry-documents/{docId}")
    @Operation(summary = "Delete document metadata + its PDF from GridFS in one call")
    @PreAuthorize("hasAnyAuthority('INDUSTRY','ADMIN')")
    public ResponseEntity<Void> deleteDocument(@PathVariable Long docId) {
        industryService.deleteDocument(docId);
        return ResponseEntity.noContent().build();
    }
}
