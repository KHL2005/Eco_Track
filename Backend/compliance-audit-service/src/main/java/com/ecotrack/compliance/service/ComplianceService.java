package com.ecotrack.compliance.service;

import com.ecotrack.compliance.dto.*;
import com.ecotrack.compliance.entity.Audit;
import com.ecotrack.compliance.entity.ComplianceRecord;
import com.ecotrack.compliance.enums.AuditStatus;
import com.ecotrack.compliance.enums.ComplianceResult;
import com.ecotrack.compliance.enums.ComplianceType;
import com.ecotrack.compliance.exception.ResourceNotFoundException;
import com.ecotrack.compliance.feign.NotificationCategory;
import com.ecotrack.compliance.feign.NotificationClient;
import com.ecotrack.compliance.feign.NotificationRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.ecotrack.compliance.repository.AuditRepository;
import com.ecotrack.compliance.repository.ComplianceRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComplianceService {

    private static final Logger log = LoggerFactory.getLogger(ComplianceService.class);

    private final ComplianceRecordRepository complianceRecordRepository;
    private final AuditRepository auditRepository;
    private final NotificationClient notificationClient;

    @Transactional
    public ComplianceRecordResponse createRecord(ComplianceRecordRequest request) {
        ComplianceRecord record = ComplianceRecord.builder()
                .entityId(request.getEntityId())
                .type(request.getType())
                .result(request.getResult())
                .notes(request.getNotes())
                .build();
        record = complianceRecordRepository.save(record);
        notify(record.getEntityId(), record.getComplianceId(),
                "A new compliance record has been created for your entity.", NotificationCategory.COMPLIANCE);
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
        record = complianceRecordRepository.save(record);
        notify(record.getEntityId(), record.getComplianceId(),
                "Your compliance record result has been updated to " + result + ".", NotificationCategory.COMPLIANCE);
        return toRecordResponse(record);
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
        Audit saved = auditRepository.save(audit);
        notify(saved.getOfficerId(), saved.getAuditId(),
                "A new audit has been assigned to you.", NotificationCategory.AUDIT);
        return toAuditResponse(saved);
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
        validateAuditTransition(audit.getStatus(), status);
        audit.setStatus(status);
        if (findings != null) audit.setFindings(findings);
        Audit saved = auditRepository.save(audit);
        notify(saved.getOfficerId(), saved.getAuditId(),
                "Your audit status has been updated to " + status + ".", NotificationCategory.AUDIT);
        return toAuditResponse(saved);
    }

    /**
     * Audit lifecycle is unidirectional:
     *   PLANNED → IN_PROGRESS → COMPLETED
     * Either of the first two may also transition to CANCELLED.
     * COMPLETED and CANCELLED are terminal — no further status changes.
     * Re-applying the same status is a no-op (allowed) so callers may safely
     * resend the current status when only the findings text is being updated.
     */
    private void validateAuditTransition(AuditStatus from, AuditStatus to) {
        if (from == to) return;
        boolean allowed = switch (from) {
            case PLANNED     -> to == AuditStatus.IN_PROGRESS || to == AuditStatus.CANCELLED;
            case IN_PROGRESS -> to == AuditStatus.COMPLETED   || to == AuditStatus.CANCELLED;
            case COMPLETED, CANCELLED -> false;
        };
        if (!allowed) {
            throw new IllegalArgumentException(
                "Invalid audit status transition: " + from + " → " + to
                + ". Audits move forward only (PLANNED → IN_PROGRESS → COMPLETED) and"
                + " COMPLETED / CANCELLED are terminal.");
        }
    }

    public byte[] generateComplianceReport() {
        List<ComplianceRecord> all = complianceRecordRepository.findAll();
        DateTimeFormatter ts = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        StringBuilder sb = new StringBuilder(4096);

        sb.append("EcoTrack Compliance Audit Report\n");
        sb.append("Generated,").append(LocalDateTime.now().format(ts)).append("\n");
        sb.append("\n");

        // Section 1 — Total Count
        sb.append("=== TOTAL COUNT ===\n");
        sb.append("Total Records,").append(all.size()).append("\n");
        sb.append("\n");

        // Section 2 — Summary by Type and Result
        sb.append("=== SUMMARY BY TYPE AND RESULT ===\n");
        sb.append("Type,Passed (Compliant),Failed (Non-Compliant),Partially Compliant,Pending,Total\n");
        for (ComplianceType type : ComplianceType.values()) {
            Map<ComplianceResult, Long> counts = all.stream()
                    .filter(r -> r.getType() == type)
                    .collect(Collectors.groupingBy(ComplianceRecord::getResult, Collectors.counting()));
            long passed    = counts.getOrDefault(ComplianceResult.COMPLIANT, 0L);
            long failed    = counts.getOrDefault(ComplianceResult.NON_COMPLIANT, 0L);
            long partial   = counts.getOrDefault(ComplianceResult.PARTIALLY_COMPLIANT, 0L);
            long pending   = counts.getOrDefault(ComplianceResult.PENDING, 0L);
            long total     = passed + failed + partial + pending;
            sb.append(type.name()).append(',')
              .append(passed).append(',')
              .append(failed).append(',')
              .append(partial).append(',')
              .append(pending).append(',')
              .append(total).append('\n');
        }
        sb.append("\n");

        // Section 3 — Detailed Breakdown grouped by Type
        sb.append("=== DETAILED BREAKDOWN ===\n");
        Map<ComplianceType, List<ComplianceRecord>> byType = all.stream()
                .collect(Collectors.groupingBy(ComplianceRecord::getType));
        for (ComplianceType type : ComplianceType.values()) {
            List<ComplianceRecord> records = byType.getOrDefault(type, List.of());
            sb.append("\n--- ").append(type.name())
              .append(" (").append(records.size()).append(" records) ---\n");
            if (records.isEmpty()) {
                sb.append("No records.\n");
                continue;
            }
            sb.append("ID,Entity ID,Result,Date,Notes\n");
            for (ComplianceRecord r : records) {
                sb.append(r.getComplianceId()).append(',')
                  .append(r.getEntityId()).append(',')
                  .append(r.getResult().name()).append(',')
                  .append(r.getDate() != null ? r.getDate().format(ts) : "").append(',')
                  .append(csvEscape(r.getNotes())).append('\n');
            }
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csvEscape(String s) {
        if (s == null || s.isEmpty()) return "";
        boolean needsQuote = s.indexOf(',') >= 0 || s.indexOf('"') >= 0
                || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0;
        String escaped = s.replace("\"", "\"\"");
        return needsQuote ? "\"" + escaped + "\"" : escaped;
    }

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
