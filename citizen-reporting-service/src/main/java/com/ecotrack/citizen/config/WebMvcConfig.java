package com.ecotrack.citizen.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Configures Spring MVC to serve uploaded files as static resources.
 * Uploaded files saved to uploads/citizen-media/issue_{id}/
 * are served at: /media-files/issue_{id}/{fileName}
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/citizen-media}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
        String uploadAbsolutePath = uploadPath.toUri().toString();

        registry.addResourceHandler("/media-files/**")
                .addResourceLocations(uploadAbsolutePath);
    }
}

