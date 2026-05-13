package com.ecotrack.industry.service;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.entity.EmissionLog;
import com.ecotrack.industry.entity.IndustryDocument;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.EmissionType;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.ResourceNotFoundException;
import com.ecotrack.industry.feign.NotificationCategory;
import com.ecotrack.industry.feign.NotificationClient;
import com.ecotrack.industry.feign.NotificationRequest;
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
    private final NotificationClient         notificationClient;

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
        EmissionLogResponse response = toEmissionResponse(emissionLogRepository.save(emissionLog));
        notify(industryUserId, response.getLogId(),
                "Your emission log for '" + normalizedName + "' has been submitted for review.",
                NotificationCategory.EMISSION);
        return response;
    }

    public List<EmissionLogResponse> getAllEmissions(Long callerId, String callerRole) {
        List<EmissionLog> logs = "INDUSTRY".equals(callerRole) && callerId != null
                ? emissionLogRepository.findByIndustryId(callerId)
                : emissionLogRepository.findAll();
        return logs.stream().map(this::toEmissionResponse).collect(Collectors.toList());
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
        EmissionLogResponse response = toEmissionResponse(emissionLogRepository.save(emissionLog));
        String msg = status == EmissionStatus.APPROVED
                ? "Your emission log has been approved."
                : "Your emission log has been rejected.";
        notify(emissionLog.getIndustryId(), emissionLog.getLogId(), msg, NotificationCategory.EMISSION);
        return response;
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

        // Step 3 – store the GridFS ObjectId, original filename, and self-serving view URL
        doc.setGridFsFileId(gridFsId);
        doc.setFileName(file.getOriginalFilename());
        doc.setFileUri("/api/v1/industry-documents/" + doc.getDocumentId() + "?view=true");
        doc = documentRepository.save(doc);

        log.info("Document {} saved, PDF stored in GridFS id={}", doc.getDocumentId(), gridFsId);
        IndustryDocumentResponse response = toDocumentResponse(doc);
        notify(industryUserId, response.getDocumentId(),
                "Your compliance document has been submitted and is pending review.",
                NotificationCategory.COMPLIANCE);
        return response;
    }

    public List<IndustryDocumentResponse> getAllDocuments(Long callerId, String callerRole) {
        List<IndustryDocument> docs = "INDUSTRY".equals(callerRole) && callerId != null
                ? documentRepository.findByIndustryId(callerId)
                : documentRepository.findAll();
        return docs.stream().map(this::toDocumentResponse).collect(Collectors.toList());
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
        IndustryDocumentResponse response = toDocumentResponse(documentRepository.save(doc));
        String msg = status == VerificationStatus.APPROVED
                ? "Your compliance document has been approved."
                : "Your compliance document has been rejected.";
        notify(doc.getIndustryId(), doc.getDocumentId(), msg, NotificationCategory.COMPLIANCE);
        return response;
    }

    /**
     * Deletes MySQL metadata AND the linked PDF from MongoDB GridFS together.
     */
    @Transactional
    public void deleteDocument(Long docId) {
        IndustryDocument doc = findDocumentById(docId);
        try {
            if (doc.getGridFsFileId() != null && !doc.getGridFsFileId().isBlank()) {
                gridFsService.deletePdfById(doc.getGridFsFileId());
            } else {
                gridFsService.deletePdfByDocumentId(docId);
            }
            log.info("PDF deleted from GridFS for documentId={}", docId);
        } catch (Exception e) {
            log.warn("No PDF found in GridFS for documentId={} — skipping GridFS delete", docId);
        }
        documentRepository.deleteById(docId);
        log.info("IndustryDocument {} deleted", docId);
    }

    /**
     * Fetches the raw PDF bytes from GridFS — called by the controller for view/download.
     * Uses the stored GridFS ObjectId for an exact, reliable lookup.
     */
    public Map<String, Object> getPdfForDocument(Long docId) {
        IndustryDocument doc = findDocumentById(docId);
        if (doc.getGridFsFileId() == null || doc.getGridFsFileId().isBlank()) {
            // Fallback for documents uploaded before this fix (no gridFsFileId stored)
            return gridFsService.getPdfByDocumentId(docId);
        }
        return gridFsService.getPdfById(doc.getGridFsFileId());
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────

    private void notify(Long userId, Long entityId, String message, NotificationCategory category) {
        try {
            notificationClient.createNotification(
                    NotificationRequest.builder()
                            .userId(userId)
                            .entityId(entityId)
                            .message(message)
                            .category(category)
                            .build());
        } catch (Exception e) {
            log.warn("Failed to send notification to userId={}: {}", userId, e.getMessage());
        }
    }

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
                .docType(d.getDocType()).fileUri(d.getFileUri()).fileName(d.getFileName()).description(d.getDescription())
                .uploadedDate(d.getUploadedDate()).verificationStatus(d.getVerificationStatus())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
                .build();
    }
}

