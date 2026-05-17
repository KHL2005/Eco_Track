package com.ecotrack.industry.dto;

/** Result returned by FileStorageService.store() — metadata about the file written to disk. */
public record StoredFileInfo(String filePath, String originalFilename, String contentType, long fileSize) {}
