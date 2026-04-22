package com.ecotrack.project.config;

import com.ecotrack.project.dto.ImpactMetrics;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter that transparently serializes ImpactMetrics
 * to a JSON string for DB storage and deserializes it back on read.
 * No schema change needed — the DB column stays as TEXT / VARCHAR.
 */
@Converter(autoApply = true)
public class ImpactMetricsConverter implements AttributeConverter<ImpactMetrics, String> {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Override
    public String convertToDatabaseColumn(ImpactMetrics metrics) {
        if (metrics == null) return null;
        try {
            return MAPPER.writeValueAsString(metrics);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not serialize ImpactMetrics to JSON", e);
        }
    }

    @Override
    public ImpactMetrics convertToEntityAttribute(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return MAPPER.readValue(json, ImpactMetrics.class);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Could not deserialize ImpactMetrics from JSON: " + json, e);
        }
    }
}

