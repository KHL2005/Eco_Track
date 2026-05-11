package com.ecotrack.industry.service;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.entity.EmissionLog;
import com.ecotrack.industry.entity.IndustryDocument;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.EmissionType;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.ResourceNotFoundException;
import com.ecotrack.industry.repository.EmissionLogRepository;
import com.ecotrack.industry.repository.IndustryDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndustryService {

    private final EmissionLogRepository      emissionLogRepository;
    private final IndustryDocumentRepository documentRepository;
    private final GridFsService              gridFsService;

    // ─── Emission Log CRUD ────────────────────────────────────────────────────

    @Transactional
    public EmissionLogResponse logEmission(EmissionLogRequest request, Long industryUserId) {
        String normalizedName = request.getIndustryName().trim();
        EmissionType emissionType = request.getType();
        EmissionLog emissionLog = EmissionLog.builder()
                .industryId(industryUserId)
                .registrationNumber(request.getRegistrationNumber().trim())
                .industryName(normalizedName)
                .type(emissionType)
                .quantity(request.getQuantity())
                .description(request.getDescription())
                .status(EmissionStatus.SUBMITTED)
                .build();
        return toEmissionResponse(emissionLogRepository.save(emissionLog));
    }

    public List<EmissionLogResponse> getAllEmissions() {
        return emissionLogRepository.findAll().stream().map(this::toEmissionResponse).collect(Collectors.toList());
    }

    public EmissionLogResponse getEmissionById(Long id) {
        return toEmissionResponse(findEmissionById(id));
    }

    public List<EmissionLogResponse> getEmissionsByIndustryName(String industryName) {
        if (industryName == null || industryName.isBlank()) throw new BadRequestException("Industry name is required");
        return emissionLogRepository.findByIndustryName(industryName.trim()).stream().map(this::toEmissionResponse).collect(Collectors.toList());
    }

    @Transactional
    public EmissionLogResponse updateEmissionStatus(Long id, EmissionStatus status) {
        if (status == null) throw new BadRequestException("Status is required");
        EmissionLog emissionLog = findEmissionById(id);
        validateEmissionStatusTransition(emissionLog.getStatus(), status);
        emissionLog.setStatus(status);
        return toEmissionResponse(emissionLogRepository.save(emissionLog));
    }

    @Transactional
    public void deleteEmission(Long id) {
        findEmissionById(id);
        emissionLogRepository.deleteById(id);
        log.info("EmissionLog {} deleted", id);
    }

    // ─── Industry Document CRUD ───────────────────────────────────────────────

    /**
     * Saves metadata to MySQL and uploads the PDF to MongoDB GridFS in one call.
     * fileUri is auto-set to "/api/v1/industry-documents/{id}?view=true".
     */
    @Transactional
    public IndustryDocumentResponse submitDocument(IndustryDocumentRequest request, MultipartFile file, Long industryUserId) {
        // Step 1 – save metadata with temporary fileUri
        IndustryDocument doc = IndustryDocument.builder()
                .industryId(industryUserId)
                .registrationNumber(request.getRegistrationNumber().trim())
                .industryName(request.getIndustryName().trim())
                .docType(request.getDocType())
                .fileUri("pending")
                .description(request.getDescription())
                .verificationStatus(VerificationStatus.SUBMITTED)
                .build();
        doc = documentRepository.save(doc);

        // Step 2 – upload PDF to GridFS (validates type + 10 MB limit internally)
        String gridFsId = gridFsService.storePdf(file, doc.getDocumentId());

        // Step 3 – replace fileUri with the self-serving view URL
        doc.setFileUri("/api/v1/industry-documents/" + doc.getDocumentId() + "?view=true");
        doc = documentRepository.save(doc);

        log.info("Document {} saved, PDF stored in GridFS id={}", doc.getDocumentId(), gridFsId);
        return toDocumentResponse(doc);
    }

    public List<IndustryDocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream().map(this::toDocumentResponse).collect(Collectors.toList());
    }

    public IndustryDocumentResponse getDocumentById(Long docId) {
        return toDocumentResponse(findDocumentById(docId));
    }

    public List<IndustryDocumentResponse> getDocumentsByIndustryName(String industryName) {
        if (industryName == null || industryName.isBlank()) throw new BadRequestException("Industry name is required");
        return documentRepository.findByIndustryName(industryName.trim()).stream().map(this::toDocumentResponse).collect(Collectors.toList());
    }

    @Transactional
    public IndustryDocumentResponse verifyDocument(Long docId, VerificationStatus status) {
        if (status == null) throw new BadRequestException("Verification status is required");
        IndustryDocument doc = findDocumentById(docId);
        validateDocumentStatusTransition(doc.getVerificationStatus(), status);
        doc.setVerificationStatus(status);
        return toDocumentResponse(documentRepository.save(doc));
    }

    /**
     * Deletes MySQL metadata AND the linked PDF from MongoDB GridFS together.
     */
    @Transactional
    public void deleteDocument(Long docId) {
        findDocumentById(docId);
        try {
            gridFsService.deletePdfByDocumentId(docId);
            log.info("PDF deleted from GridFS for documentId={}", docId);
        } catch (Exception e) {
            log.warn("No PDF found in GridFS for documentId={} — skipping GridFS delete", docId);
        }
        documentRepository.deleteById(docId);
        log.info("IndustryDocument {} deleted", docId);
    }

    /**
     * Fetches the raw PDF bytes from GridFS — called by the controller for view/download.
     */
    public Map<String, Object> getPdfForDocument(Long docId) {
        findDocumentById(docId); // validate document exists in MySQL first
        return gridFsService.getPdfByDocumentId(docId);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private EmissionLog findEmissionById(Long id) {
        return emissionLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmissionLog", id));
    }

    private IndustryDocument findDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("IndustryDocument", id));
    }

    private void validateEmissionStatusTransition(EmissionStatus current, EmissionStatus next) {
        if (current == next) return;
        boolean valid = switch (current) {
            case SUBMITTED -> next == EmissionStatus.APPROVED || next == EmissionStatus.REJECTED;
            case APPROVED, REJECTED -> false;
        };
        if (!valid) throw new BadRequestException("Invalid status transition from " + current + " to " + next);
    }

    private void validateDocumentStatusTransition(VerificationStatus current, VerificationStatus next) {
        if (current == next) return;
        boolean valid = switch (current) {
            case SUBMITTED -> next == VerificationStatus.APPROVED || next == VerificationStatus.REJECTED;
            case APPROVED, REJECTED -> false;
        };
        if (!valid) throw new BadRequestException("Invalid status transition from " + current + " to " + next);
    }

    // ─── Mappers ─────────────────────────────────────────────────────────────

    private EmissionLogResponse toEmissionResponse(EmissionLog e) {
        return EmissionLogResponse.builder()
                .logId(e.getLogId()).industryId(e.getIndustryId()).registrationNumber(e.getRegistrationNumber()).industryName(e.getIndustryName())
                .type(e.getType()).quantity(e.getQuantity()).description(e.getDescription()).date(e.getDate())
                .status(e.getStatus()).createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                .build();
    }

    private IndustryDocumentResponse toDocumentResponse(IndustryDocument d) {
        return IndustryDocumentResponse.builder()
                .documentId(d.getDocumentId()).industryId(d.getIndustryId()).registrationNumber(d.getRegistrationNumber()).industryName(d.getIndustryName())
                .docType(d.getDocType()).fileUri(d.getFileUri()).description(d.getDescription())
                .uploadedDate(d.getUploadedDate()).verificationStatus(d.getVerificationStatus())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
                .build();
    }
}

