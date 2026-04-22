package com.ecotrack.citizen.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Schema(description = "Multipart form-data request for uploading media files")
public class MediaUploadRequest {

    @Schema(
        type = "array",
        format = "binary",
        description = "One or more image or video files to attach to the issue. " +
                      "Allowed types: jpg, png, gif, mp4, avi, mov. Max 5 files, 50MB each."
    )
    private List<MultipartFile> files;
}

