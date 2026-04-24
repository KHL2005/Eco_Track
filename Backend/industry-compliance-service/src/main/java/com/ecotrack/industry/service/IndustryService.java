package com.ecotrack.industry.service;

import com.ecotrack.industry.dto.*;
import com.ecotrack.industry.entity.EmissionLog;
import com.ecotrack.industry.entity.IndustryDocument;
import com.ecotrack.industry.enums.EmissionStatus;
import com.ecotrack.industry.enums.VerificationStatus;
import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.DuplicateResourceException;
import com.ecotrack.industry.exception.ResourceNotFoundException;
import com.ecotrack.industry.repository.EmissionLogRepository;
import com.ecotrack.industry.repository.IndustryDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IndustryService {

    private final EmissionLogRepository emissionLogRepository;
    private final IndustryDocumentRepository documentRepository;

    // ─── Emission Log CRUD ────────────────────────────────────────

    @Transactional
    public EmissionLogResponse logEmission(EmissionLogRequest request) {
        String normalizedName = request.getIndustryName().trim();
        String normalizedType = request.getType().trim();

        if (emissionLogRepository.existsByIndustryNameAndType(normalizedName, normalizedType)) {
            throw new DuplicateResourceException(
                    "Emission record already exists for company '" + normalizedName +
                    "' with emission type '" + normalizedType + "'");
        }

        EmissionLog emissionLog = EmissionLog.builder()
                .industryId(request.getIndustryId())
                .industryName(normalizedName)
                .type(normalizedType)
                .quantity(request.getQuantity())
                .status(EmissionStatus.SUBMITTED)
                .build();
        return toEmissionResponse(emissionLogRepository.save(emissionLog));
    }

    public List<EmissionLogResponse> getAllEmissions() {
        return emissionLogRepository.findAll().stream()
                .map(this::toEmissionResponse)
                .collect(Collectors.toList());
    }

    public EmissionLogResponse getEmissionById(Long id) {
        return toEmissionResponse(findEmissionById(id));
    }

    public List<EmissionLogResponse> getEmissionsByIndustry(Long industryId) {
        if (industryId == null) {
            throw new BadRequestException("Industry ID is required");
        }
        return emissionLogRepository.findByIndustryId(industryId).stream()
                .map(this::toEmissionResponse)
                .collect(Collectors.toList());
    }

    public List<EmissionLogResponse> getEmissionsByIndustryName(String industryName) {
        if (industryName == null || industryName.isBlank()) {
            throw new BadRequestException("Industry name is required");
        }
        return emissionLogRepository.findByIndustryName(industryName.trim()).stream()
                .map(this::toEmissionResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    public EmissionLogResponse updateEmissionStatus(Long id, EmissionStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        EmissionLog emissionLog = findEmissionById(id);
        validateEmissionStatusTransition(emissionLog.getStatus(), status);
        emissionLog.setStatus(status);
        return toEmissionResponse(emissionLogRepository.save(emissionLog));
    }

    @Transactional
    public void deleteEmission(Long id) {
        findEmissionById(id); // validates existence
        emissionLogRepository.deleteById(id);
        log.info("EmissionLog {} deleted", id);
    }

    // ─── Industry Document CRUD ───────────────────────────────────

    @Transactional
    public IndustryDocumentResponse submitDocument(IndustryDocumentRequest request) {
        IndustryDocument doc = IndustryDocument.builder()
                .industryId(request.getIndustryId())
                .industryName(request.getIndustryName().trim())
                .docType(request.getDocType())
                .fileUri(request.getFileUri())
                .description(request.getDescription())
                .verificationStatus(VerificationStatus.SUBMITTED)
                .build();
        return toDocumentResponse(documentRepository.save(doc));
    }

    public List<IndustryDocumentResponse> getAllDocuments() {
        return documentRepository.findAll().stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());
    }

    public IndustryDocumentResponse getDocumentById(Long docId) {
        return toDocumentResponse(findDocumentById(docId));
    }

    public List<IndustryDocumentResponse> getDocumentsByIndustry(Long industryId) {
        if (industryId == null) {
            throw new BadRequestException("Industry ID is required");
        }
        return documentRepository.findByIndustryId(industryId).stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());
    }

    public List<IndustryDocumentResponse> getDocumentsByIndustryName(String industryName) {
        if (industryName == null || industryName.isBlank()) {
            throw new BadRequestException("Industry name is required");
        }
        return documentRepository.findByIndustryName(industryName.trim()).stream()
                .map(this::toDocumentResponse)
                .collect(Collectors.toList());
    }


    @Transactional
    public IndustryDocumentResponse verifyDocument(Long docId, VerificationStatus status) {
        if (status == null) {
            throw new BadRequestException("Verification status is required");
        }
        IndustryDocument doc = findDocumentById(docId);
        validateDocumentStatusTransition(doc.getVerificationStatus(), status);
        doc.setVerificationStatus(status);
        return toDocumentResponse(documentRepository.save(doc));
    }

    @Transactional
    public void deleteDocument(Long docId) {
        findDocumentById(docId); // validates existence
        documentRepository.deleteById(docId);
        log.info("IndustryDocument {} deleted", docId);
    }

    // ─── Private Helpers ─────────────────────────────────────────

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
            case APPROVED, REJECTED -> false; // terminal states
        };
        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition from " + current + " to " + next);
        }
    }

    private void validateDocumentStatusTransition(VerificationStatus current, VerificationStatus next) {
        if (current == next) return;
        boolean valid = switch (current) {
            case SUBMITTED -> next == VerificationStatus.APPROVED || next == VerificationStatus.REJECTED;
            case APPROVED, REJECTED -> false; // terminal states
        };
        if (!valid) {
            throw new BadRequestException(
                    "Invalid status transition from " + current + " to " + next);
        }
    }

    // ─── Mappers ─────────────────────────────────────────────────

    private EmissionLogResponse toEmissionResponse(EmissionLog e) {
        return EmissionLogResponse.builder()
                .logId(e.getLogId())
                .industryId(e.getIndustryId())
                .industryName(e.getIndustryName())
                .type(e.getType())
                .quantity(e.getQuantity())
                .date(e.getDate())
                .status(e.getStatus())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .build();
    }

    private IndustryDocumentResponse toDocumentResponse(IndustryDocument d) {
        return IndustryDocumentResponse.builder()
                .documentId(d.getDocumentId())
                .industryId(d.getIndustryId())
                .industryName(d.getIndustryName())
                .docType(d.getDocType())
                .fileUri(d.getFileUri())
                .description(d.getDescription())
                .uploadedDate(d.getUploadedDate())
                .verificationStatus(d.getVerificationStatus())
                .createdAt(d.getCreatedAt())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}

