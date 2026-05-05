package com.ecotrack.compliance.service;

import com.ecotrack.compliance.dto.*;
import com.ecotrack.compliance.entity.Audit;
import com.ecotrack.compliance.entity.ComplianceRecord;
import com.ecotrack.compliance.enums.AuditStatus;
import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import com.ecotrack.compliance.exception.ResourceNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.ecotrack.compliance.repository.AuditRepository;
import com.ecotrack.compliance.repository.ComplianceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private static final Logger log = LoggerFactory.getLogger(ComplianceService.class);

    private final ComplianceRecordRepository complianceRecordRepository;
    private final AuditRepository auditRepository;

    @Transactional
    public ComplianceRecordResponse createRecord(ComplianceRecordRequest request) {
        ComplianceRecord record = ComplianceRecord.builder()
                .entityId(request.getEntityId())
                .type(request.getType())
                .result(request.getResult())
                .notes(request.getNotes())
                .build();
        record = complianceRecordRepository.save(record);

        return toRecordResponse(record);
    }

    public List<ComplianceRecordResponse> getAllRecords() {
        return complianceRecordRepository.findAll().stream()
                .map(this::toRecordResponse).collect(Collectors.toList());
    }

    public ComplianceRecordResponse getRecordById(Long id) {
        return toRecordResponse(complianceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ComplianceRecord", id)));
    }

    public List<ComplianceRecordResponse> getByEntityId(Long entityId) {
        return complianceRecordRepository.findByEntityId(entityId).stream()
                .map(this::toRecordResponse).collect(Collectors.toList());
    }

    public List<ComplianceRecordResponse> getByType(ComplianceType type) {
        return complianceRecordRepository.findByType(type).stream()
                .map(this::toRecordResponse).collect(Collectors.toList());
    }

    public List<ComplianceRecordResponse> getByResult(ComplianceResult result) {
        return complianceRecordRepository.findByResult(result).stream()
                .map(this::toRecordResponse).collect(Collectors.toList());
    }

    @Transactional
    public ComplianceRecordResponse updateRecord(Long id, ComplianceResult result, String notes) {
        ComplianceRecord record = complianceRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ComplianceRecord", id));
        record.setResult(result);
        if (notes != null) record.setNotes(notes);
        return toRecordResponse(complianceRecordRepository.save(record));
    }

    @Transactional
    public void deleteRecord(Long id) {
        if (!complianceRecordRepository.existsById(id)) throw new ResourceNotFoundException("ComplianceRecord", id);
        complianceRecordRepository.deleteById(id);
    }

    @Transactional
    public AuditResponse createAudit(AuditRequest request) {
        Audit audit = Audit.builder()
                .officerId(request.getOfficerId())
                .scope(request.getScope())
                .findings(request.getFindings())
                .build();
        return toAuditResponse(auditRepository.save(audit));
    }

    public List<AuditResponse> getAllAudits() {
        return auditRepository.findAll().stream().map(this::toAuditResponse).collect(Collectors.toList());
    }

    public AuditResponse getAuditById(Long id) {
        return toAuditResponse(auditRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit", id)));
    }

    public List<AuditResponse> getAuditsByOfficer(Long officerId) {
        return auditRepository.findByOfficerId(officerId).stream()
                .map(this::toAuditResponse).collect(Collectors.toList());
    }

    @Transactional
    public AuditResponse updateAuditStatus(Long id, AuditStatus status, String findings) {
        Audit audit = auditRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit", id));
        audit.setStatus(status);
        if (findings != null) audit.setFindings(findings);
        return toAuditResponse(auditRepository.save(audit));
    }

    private ComplianceRecordResponse toRecordResponse(ComplianceRecord r) {
        return ComplianceRecordResponse.builder()
                .complianceId(r.getComplianceId()).entityId(r.getEntityId())
                .type(r.getType()).result(r.getResult()).date(r.getDate())
                .notes(r.getNotes()).createdAt(r.getCreatedAt()).updatedAt(r.getUpdatedAt()).build();
    }

    private AuditResponse toAuditResponse(Audit a) {
        return AuditResponse.builder()
                .auditId(a.getAuditId()).officerId(a.getOfficerId())
                .scope(a.getScope()).findings(a.getFindings()).date(a.getDate())
                .status(a.getStatus()).createdAt(a.getCreatedAt()).updatedAt(a.getUpdatedAt()).build();
    }
}
