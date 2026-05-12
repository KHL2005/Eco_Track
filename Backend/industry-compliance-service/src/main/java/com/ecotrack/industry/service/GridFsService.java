package com.ecotrack.industry.service;

import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.ResourceNotFoundException;
import com.mongodb.client.gridfs.model.GridFSFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class GridFsService {

    // GridFsTemplate implements GridFsOperations — single bean, no ambiguity
    private final GridFsTemplate gridFsTemplate;

    private static final long   MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024;
    private static final String CONTENT_TYPE_PDF    = "application/pdf";

    // ── Upload ────────────────────────────────────────────────────────────────

    /**
     * Stores a PDF in GridFS and returns its ObjectId string.
     *
     * @param file       the uploaded multipart file
     * @param documentId the MySQL industry-document ID this PDF belongs to
     * @return GridFS file ObjectId as String
     */
        public String storePdf(MultipartFile file, Long documentId) {
            validatePdf(file);

            try {
                // Build metadata stored alongside the file in GridFS
                org.bson.Document metadata = new org.bson.Document();
                metadata.put("contentType", file.getContentType());
                metadata.put("documentId",  documentId);

                ObjectId fileId = gridFsTemplate.store(
                        file.getInputStream(),
                        file.getOriginalFilename(),
                        file.getContentType(),
                        metadata
                );

                log.info("PDF '{}' stored in GridFS id={} for documentId={}",
                        file.getOriginalFilename(), fileId, documentId);

                return fileId.toHexString();

            } catch (IOException e) {
                throw new BadRequestException("Failed to read uploaded file: " + e.getMessage());
            }
    }

    // ── Retrieve by GridFS file id ────────────────────────────────────────────

    /**
     * Returns raw PDF bytes by GridFS file id.
     */
    public Map<String, Object> getPdfById(String fileId) {
        GridFSFile gridFsFile = gridFsTemplate.findOne(
                new Query(Criteria.where("_id").is(new ObjectId(fileId)))
        );

        if (gridFsFile == null)
            throw new ResourceNotFoundException("PDF file not found with id: " + fileId);

        return buildResult(gridFsFile);
    }

    // ── Retrieve by linked documentId ─────────────────────────────────────────

    /**
     * Returns raw PDF bytes by linked MySQL documentId (stored in metadata).
     */
    public Map<String, Object> getPdfByDocumentId(Long documentId) {
        GridFSFile gridFsFile = gridFsTemplate.findOne(
                new Query(Criteria.where("metadata.documentId").is(documentId))
        );

        if (gridFsFile == null)
            throw new ResourceNotFoundException("PDF file not found for documentId: " + documentId);

        return buildResult(gridFsFile);
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    public void deletePdfByDocumentId(Long documentId) {
        gridFsTemplate.delete(
                new Query(Criteria.where("metadata.documentId").is(documentId))
        );
        log.info("PDF deleted from GridFS for documentId={}", documentId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Map<String, Object> buildResult(GridFSFile gridFsFile) {
        try {
            InputStream in   = gridFsTemplate.getResource(gridFsFile).getInputStream();
            byte[]      data = in.readAllBytes();

            Map<String, Object> result = new HashMap<>();
            result.put("data",        data);
            result.put("fileName",    gridFsFile.getFilename());
            result.put("contentType", gridFsFile.getMetadata() != null
                    ? gridFsFile.getMetadata().getString("contentType")
                    : CONTENT_TYPE_PDF);
            result.put("fileSize",    gridFsFile.getLength());
            return result;
        } catch (IOException e) {
            throw new BadRequestException("Failed to read PDF from storage: " + e.getMessage());
        }
    }

    private void validatePdf(MultipartFile file) {
        if (file == null || file.isEmpty())
            throw new BadRequestException("File must not be empty");
        if (file.getSize() > MAX_FILE_SIZE_BYTES)
            throw new BadRequestException("File size " + (file.getSize() / (1024 * 1024))
                    + " MB exceeds maximum allowed 10 MB");
        String ct = file.getContentType();
        if (ct == null || !ct.equalsIgnoreCase(CONTENT_TYPE_PDF))
            throw new BadRequestException("Only PDF files are accepted. Received: " + ct);
    }
}
