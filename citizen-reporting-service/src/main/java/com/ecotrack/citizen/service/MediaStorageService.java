package com.ecotrack.citizen.service;

import com.ecotrack.citizen.exception.BadRequestException;
import com.ecotrack.citizen.exception.ResourceNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class MediaStorageService {

    @Value("${app.upload.dir:uploads/citizen-media}")
    private String uploadDir;

    @Value("${app.upload.allowed-types:image/jpeg,image/png,image/gif,video/mp4,video/avi,video/quicktime}")
    private String allowedTypes;

    @Value("${app.upload.max-files-per-issue:5}")
    private int maxFilesPerIssue;

    // ─── Store ────────────────────────────────────────────────────

    /**
     * Saves a file to disk under uploads/citizen-media/issue_{id}/
     * Returns a RELATIVE path like "issue_1/uuid_filename.jpg"
     * which is stored in DB and used to build HTTP serving URLs.
     */
    public String store(MultipartFile file, Long issueId) {
        validateFile(file);

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");

        if (originalName.contains("..")) {
            throw new BadRequestException("Invalid file name: " + originalName);
        }

        String uniqueName = UUID.randomUUID() + "_" + originalName;
        String relativePath = "issue_" + issueId + "/" + uniqueName;
        Path issueDir = Paths.get(uploadDir, "issue_" + issueId);

        try {
            Files.createDirectories(issueDir);
            Path target = issueDir.resolve(uniqueName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored media file: {}", target.toAbsolutePath());
            return relativePath;   // e.g.  "issue_1/uuid_photo.jpg"
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalName, e);
        }
    }

    // ─── Load (stream file) ───────────────────────────────────────

    /**
     * Loads file as Spring Resource given a relative path (from DB).
     * Resolves against the configured upload directory.
     */
    public Resource load(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(relativePath).toAbsolutePath().normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new ResourceNotFoundException("Media file not found or not readable: " + relativePath);
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Media file not found: " + relativePath);
        }
    }

    // ─── Delete ───────────────────────────────────────────────────

    /**
     * Deletes a file from disk given its relative path (from DB).
     */
    public void delete(String relativePath) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(relativePath);
            boolean deleted = Files.deleteIfExists(filePath);
            if (deleted) log.info("Deleted media file: {}", filePath);
            else         log.warn("Media file not found on disk, skipping: {}", filePath);
        } catch (IOException e) {
            log.warn("Could not delete media file {}: {}", relativePath, e.getMessage());
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────

    public int getMaxFilesPerIssue() {
        return maxFilesPerIssue;
    }

    /** Derive HTTP content-type from file extension. */
    public String resolveContentType(String path) {
        String lower = path.toLowerCase();
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".gif"))  return "image/gif";
        if (lower.endsWith(".mp4"))  return "video/mp4";
        if (lower.endsWith(".avi"))  return "video/x-msvideo";
        if (lower.endsWith(".mov"))  return "video/quicktime";
        return "application/octet-stream";
    }

    // ─── Validation ───────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File must not be empty");
        }
        String contentType = file.getContentType();
        List<String> allowed = Arrays.asList(allowedTypes.split(","));
        if (contentType == null || allowed.stream().noneMatch(t -> t.trim().equalsIgnoreCase(contentType))) {
            throw new BadRequestException(
                    "Unsupported file type: '" + contentType + "'. Allowed: " + allowedTypes);
        }
    }
}
