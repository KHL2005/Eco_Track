package com.ecotrack.industry.service;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.entity.EmissionLog;
import com.ecotrack.industry.entity.IndustryDocument;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.EmissionType;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.FileStorageException;
import com.ecotrack.industry.exception.ResourceNotFoundException;
import com.ecotrack.industry.feign.NotificationCategory;
import com.ecotrack.industry.feign.NotificationClient;
import com.ecotrack.industry.feign.NotificationRequest;
import com.ecotrack.industry.repository.EmissionLogRepository;
import com.ecotrack.industry.repository.IndustryDocumentRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndustryService {

    private final EmissionLogRepository      emissionLogRepository;
    private final IndustryDocumentRepository documentRepository;
    private final NotificationClient         notificationClient;

    // ─── File Storage Setup ───────────────────────────────────────────────────

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg"
    );

    @Value("${app.upload-dir}")
    private String uploadDirPath;

    private Path uploadDir;

    @PostConstruct
    private void initUploadDir() {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
            log.info("File storage initialized at: {}", this.uploadDir);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + uploadDirPath, e);
        }
    }

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
    public EmissionLogResponse updateEmissionStatus(Long id, EmissionStatus status, String rejectionReason) {
        if (status == null) throw new BadRequestException("Status is required");
        EmissionLog emissionLog = findEmissionById(id);
        validateEmissionStatusTransition(emissionLog.getStatus(), status);

        if (status == EmissionStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new BadRequestException("Rejection reason is required when rejecting an emission");
            }
            emissionLog.setRejectionReason(rejectionReason.trim());
        } else {
            emissionLog.setRejectionReason(null);
        }
        emissionLog.setStatus(status);

        EmissionLogResponse response = toEmissionResponse(emissionLogRepository.save(emissionLog));
        String msg = status == EmissionStatus.APPROVED
                ? "Your emission log has been approved."
                : "Your emission log has been rejected. Reason: " + emissionLog.getRejectionReason();
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

    @Transactional
    public IndustryDocumentResponse submitDocument(IndustryDocumentRequest request, MultipartFile file, Long industryUserId) {
        StoredFileInfo fileInfo = storeFile(file, industryUserId, request.getDocType().name());

        IndustryDocument doc = IndustryDocument.builder()
                .industryId(industryUserId)
                .registrationNumber(request.getRegistrationNumber().trim())
                .industryName(request.getIndustryName().trim())
                .docType(request.getDocType())
                .fileUri(fileInfo.filePath())
                .fileName(fileInfo.originalFilename())
                .contentType(fileInfo.contentType())
                .fileSize(fileInfo.fileSize())
                .description(request.getDescription())
                .verificationStatus(VerificationStatus.SUBMITTED)
                .build();
        doc = documentRepository.save(doc);

        log.info("Document {} saved, file stored at {}", doc.getDocumentId(), fileInfo.filePath());
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
    public IndustryDocumentResponse verifyDocument(Long docId, VerificationStatus status, String rejectionReason) {
        if (status == null) throw new BadRequestException("Verification status is required");
        IndustryDocument doc = findDocumentById(docId);
        validateDocumentStatusTransition(doc.getVerificationStatus(), status);

        if (status == VerificationStatus.REJECTED) {
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new BadRequestException("Rejection reason is required when rejecting a document");
            }
            doc.setRejectionReason(rejectionReason.trim());
        } else {
            doc.setRejectionReason(null);
        }
        doc.setVerificationStatus(status);

        IndustryDocumentResponse response = toDocumentResponse(documentRepository.save(doc));
        String msg = status == VerificationStatus.APPROVED
                ? "Your compliance document has been approved."
                : "Your compliance document has been rejected. Reason: " + doc.getRejectionReason();
        notify(doc.getIndustryId(), doc.getDocumentId(), msg, NotificationCategory.COMPLIANCE);
        return response;
    }

    @Transactional
    public void deleteDocument(Long docId) {
        IndustryDocument doc = findDocumentById(docId);
        documentRepository.deleteById(docId);
        deleteFile(doc.getFileUri());
        log.info("IndustryDocument {} deleted", docId);
    }

    public DownloadPayload getFileForDocument(Long docId) {
        IndustryDocument doc = findDocumentById(docId);
        return loadFileAsResource(doc.getFileUri(), doc.getFileName(), doc.getContentType(), doc.getFileSize());
    }

    // ─── File Storage Operations ──────────────────────────────────────────────

    private StoredFileInfo storeFile(MultipartFile file, Long ownerId, String category) {
        if (file == null || file.isEmpty())
            throw new FileStorageException("File must not be empty");

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank())
            throw new FileStorageException("Original filename must not be null");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new BadRequestException("Unsupported file type: " + contentType + ". Allowed: pdf, png, jpg, jpeg");

        String sanitized = sanitizeFilename(originalFilename);
        String uniqueName = ownerId + "_" + category + "_" + UUID.randomUUID() + "_" + sanitized;

        Path targetPath = uploadDir.resolve(uniqueName).normalize();
        if (!targetPath.startsWith(uploadDir))
            throw new FileStorageException("Security violation: filename resolves outside upload directory");

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File stored: owner={}, category={}, path={}", ownerId, category, targetPath);
            return new StoredFileInfo(targetPath.toAbsolutePath().toString(), originalFilename, contentType, file.getSize());
        } catch (IOException e) {
            throw new FileStorageException("Failed to write file to disk: " + originalFilename, e);
        }
    }

    private DownloadPayload loadFileAsResource(String filePath, String originalFilename, String contentType, Long fileSize) {
        try {
            Path path = Paths.get(filePath);
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable())
                throw new FileStorageException("File not found or not readable at: " + filePath);
            log.info("File loaded for download: {}", filePath);
            return new DownloadPayload(resource, originalFilename, contentType, fileSize);
        } catch (MalformedURLException e) {
            throw new FileStorageException("Invalid file path: " + filePath, e);
        }
    }

    private void deleteFile(String filePath) {
        if (filePath == null || filePath.isBlank()) return;
        try {
            boolean deleted = Files.deleteIfExists(Paths.get(filePath));
            if (deleted) log.info("File deleted from disk: {}", filePath);
            else         log.warn("File not found on disk, skipping delete: {}", filePath);
        } catch (IOException e) {
            log.error("Failed to delete file at {}: {}", filePath, e.getMessage());
        }
    }

    private String sanitizeFilename(String filename) {
        if (filename.contains(".."))
            throw new FileStorageException("Filename contains path traversal sequence: " + filename);
        String name = Paths.get(filename).getFileName().toString();
        if (name.isBlank())
            throw new FileStorageException("Invalid filename: " + filename);
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
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
                .status(e.getStatus()).rejectionReason(e.getRejectionReason()).createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                .build();
    }

    private IndustryDocumentResponse toDocumentResponse(IndustryDocument d) {
        return IndustryDocumentResponse.builder()
                .documentId(d.getDocumentId()).industryId(d.getIndustryId()).registrationNumber(d.getRegistrationNumber()).industryName(d.getIndustryName())
                .docType(d.getDocType())
                .fileUri("/api/v1/industry-documents/" + d.getDocumentId() + "?download=true")
                .fileName(d.getFileName()).description(d.getDescription())
                .uploadedDate(d.getUploadedDate()).verificationStatus(d.getVerificationStatus()).rejectionReason(d.getRejectionReason())
                .createdAt(d.getCreatedAt()).updatedAt(d.getUpdatedAt())
                .build();
    }
}
