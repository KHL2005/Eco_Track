package com.ecotrack.industry.storage;

import com.ecotrack.industry.dto.DownloadPayload;
import com.ecotrack.industry.dto.StoredFileInfo;
import com.ecotrack.industry.exception.BadRequestException;
import com.ecotrack.industry.exception.FileStorageException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of(
            "application/pdf", "image/png", "image/jpeg"
    );

    private final Path uploadDir;

    public FileStorageService(@Value("${app.upload-dir}") String uploadDirPath) {
        this.uploadDir = Paths.get(uploadDirPath).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.uploadDir);
            log.info("File storage initialized at: {}", this.uploadDir);
        } catch (IOException e) {
            throw new FileStorageException("Could not create upload directory: " + uploadDirPath, e);
        }
    }

    public StoredFileInfo store(MultipartFile file, Long ownerId, String category) {
        if (file == null || file.isEmpty())
            throw new FileStorageException("File must not be empty");

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank())
            throw new FileStorageException("Original filename must not be null");

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase()))
            throw new BadRequestException(
                    "Unsupported file type: " + contentType + ". Allowed: pdf, png, jpg, jpeg");

        String sanitized = sanitizeFilename(originalFilename);
        String uniqueName = ownerId + "_" + category + "_" + UUID.randomUUID() + "_" + sanitized;

        Path targetPath = uploadDir.resolve(uniqueName).normalize();
        if (!targetPath.startsWith(uploadDir))
            throw new FileStorageException("Security violation: filename resolves outside upload directory");

        try {
            Files.createDirectories(targetPath.getParent());
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            log.info("File stored: owner={}, category={}, path={}", ownerId, category, targetPath);
            return new StoredFileInfo(
                    targetPath.toAbsolutePath().toString(),
                    originalFilename,
                    contentType,
                    file.getSize());
        } catch (IOException e) {
            throw new FileStorageException("Failed to write file to disk: " + originalFilename, e);
        }
    }

    public DownloadPayload loadAsResource(String filePath, String originalFilename,
                                          String contentType, Long fileSize) {
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

    public void delete(String filePath) {
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
}
