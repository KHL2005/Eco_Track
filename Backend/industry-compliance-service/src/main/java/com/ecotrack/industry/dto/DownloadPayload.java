package com.ecotrack.industry.dto;

import org.springframework.core.io.Resource;

/** Carries the file Resource and its metadata for streaming a download response. */
public record DownloadPayload(Resource resource, String originalFilename, String contentType, Long fileSize) {}
