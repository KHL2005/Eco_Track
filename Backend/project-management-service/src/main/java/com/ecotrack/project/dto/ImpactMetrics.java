package com.ecotrack.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Structured impact metrics applicable to every environmental project.
 *
 * Predefined fields cover the most common environmental metrics.
 * Use customMetrics to freely add any project-specific key-value metric.
 * Stored as JSON in DB via ImpactMetricsConverter — no schema change needed.
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Schema(description = "Structured impact metrics applicable to every environmental project")
public class ImpactMetrics {

    // ─── Green Coverage ──────────────────────────────────────────

    @Schema(description = "Total number of trees planted or saplings distributed", example = "500")
    @Min(value = 0, message = "treesPlanted must be >= 0")
    private Integer treesPlanted;

    @Schema(description = "Total land or water area restored, reforested or protected in hectares", example = "25.5")
    @DecimalMin(value = "0.0", message = "areaRestoredHectares must be >= 0")
    private Double areaRestoredHectares;

    // ─── Carbon & Climate ────────────────────────────────────────

    @Schema(description = "Estimated CO2 or equivalent greenhouse gas reduced in metric tons", example = "120.0")
    @DecimalMin(value = "0.0", message = "co2ReducedTons must be >= 0")
    private Double co2ReducedTons;

    @Schema(description = "Renewable or clean energy generated or enabled in kWh", example = "5000.0")
    @DecimalMin(value = "0.0", message = "renewableEnergyKwh must be >= 0")
    private Double renewableEnergyKwh;

    // ─── Pollution ───────────────────────────────────────────────

    @Schema(description = "Total solid or plastic waste collected and disposed of safely in kg", example = "3000.0")
    @DecimalMin(value = "0.0", message = "wasteCollectedKg must be >= 0")
    private Double wasteCollectedKg;

    @Schema(description = "Number of rivers, lakes or water bodies cleaned or restored", example = "3")
    @Min(value = 0, message = "waterBodiesCleaned must be >= 0")
    private Integer waterBodiesCleaned;

    @Schema(description = "Number of active pollution or environmental incidents resolved", example = "12")
    @Min(value = 0, message = "pollutionIncidentsResolved must be >= 0")
    private Integer pollutionIncidentsResolved;

    // ─── Community ───────────────────────────────────────────────

    @Schema(description = "Number of people directly or indirectly benefited by this project", example = "10000")
    @Min(value = 0, message = "peopleBenefited must be >= 0")
    private Integer peopleBenefited;

    @Schema(description = "Number of awareness or training sessions conducted for the community", example = "8")
    @Min(value = 0, message = "awarenessSessionsConducted must be >= 0")
    private Integer awarenessSessionsConducted;

    @Schema(description = "Total number of volunteer participations or engagements recorded", example = "150")
    @Min(value = 0, message = "volunteerEngagements must be >= 0")
    private Integer volunteerEngagements;

    // ─── Custom (any project-specific metric) ────────────────────

    @Schema(
        description = "Add any project-specific metric as a free-form key-value pair. " +
                      "Key = metric name (string), Value = number or string. " +
                      "Merged on PATCH — existing keys are not removed.",
        example = "{\"aqiBefore\": 180, \"aqiAfter\": 95, \"treesPlantedNearFactory\": 50, \"soilErosionReducedTons\": 80}"
    )
    private Map<String, Object> customMetrics;

    // ─── Notes ───────────────────────────────────────────────────

    @Schema(description = "Any extra observations, achievements or free-text summary",
            example = "Local AQI improved from 180 to 95 over project duration")
    private String notes;
}
