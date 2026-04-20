package com.ecotrack.monitoring.service;

import com.ecotrack.monitoring.dto.*;
import com.ecotrack.monitoring.entity.Analysis;
import com.ecotrack.monitoring.entity.Sensor;
import com.ecotrack.monitoring.entity.SensorData;
import com.ecotrack.monitoring.enums.AnalysisStatus;
import com.ecotrack.monitoring.enums.SensorStatus;
import com.ecotrack.monitoring.enums.SensorType;
import com.ecotrack.monitoring.exception.BadRequestException;
import com.ecotrack.monitoring.exception.ResourceNotFoundException;
import com.ecotrack.monitoring.kafka.EventProducer;
import com.ecotrack.monitoring.repository.AnalysisRepository;
import com.ecotrack.monitoring.repository.SensorDataRepository;
import com.ecotrack.monitoring.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {

    private final SensorRepository sensorRepository;
    private final SensorDataRepository sensorDataRepository;
    private final AnalysisRepository analysisRepository;
    private final EventProducer eventProducer;

    // ─── Sensors ─────────────────────────────────────────────────

    @Transactional
    public SensorResponse createSensor(SensorRequest request) {
        Sensor sensor = Sensor.builder()
                .location(request.getLocation())
                .type(request.getType())
                .status(SensorStatus.ACTIVE)
                .build();
        return toSensorResponse(sensorRepository.save(sensor));
    }

    public List<SensorResponse> getAllSensors() {
        return sensorRepository.findAll().stream()
                .map(this::toSensorResponse)
                .collect(Collectors.toList());
    }

    public SensorResponse getSensorById(Long id) {
        return toSensorResponse(findSensorById(id));
    }

    public List<SensorResponse> getSensorsByType(SensorType type) {
        if (type == null) {
            throw new BadRequestException("Sensor type is required");
        }
        return sensorRepository.findByType(type).stream()
                .map(this::toSensorResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public SensorResponse updateSensor(Long id, SensorRequest request) {
        Sensor sensor = findSensorById(id);
        if (request.getLocation() != null && !request.getLocation().isBlank()) {
            sensor.setLocation(request.getLocation());
        }
        if (request.getType() != null) {
            sensor.setType(request.getType());
        }
        return toSensorResponse(sensorRepository.save(sensor));
    }

    @Transactional
    public SensorResponse updateSensorStatus(Long id, SensorStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        Sensor sensor = findSensorById(id);
        sensor.setStatus(status);
        return toSensorResponse(sensorRepository.save(sensor));
    }

    @Transactional
    public void deleteSensor(Long id) {
        findSensorById(id); // validates existence
        sensorDataRepository.findBySensorId(id).forEach(data -> {
            analysisRepository.findAllByDataId(data.getDataId())
                    .forEach(a -> analysisRepository.deleteById(a.getAnalysisId()));
            sensorDataRepository.deleteById(data.getDataId());
        });
        sensorRepository.deleteById(id);
    }

    // ─── Sensor Data ─────────────────────────────────────────────

    @Transactional
    public SensorDataResponse addSensorData(SensorDataRequest request) {
        // Validate sensor exists
        findSensorById(request.getSensorId());

        SensorData data = SensorData.builder()
                .sensorId(request.getSensorId())
                .parametersJson(request.getParametersJson())
                .build();
        data = sensorDataRepository.save(data);

        // Auto-trigger analysis with proper findings generation
        triggerAutoAnalysis(data);

        return toSensorDataResponse(data);
    }

    public SensorDataResponse getSensorDataById(Long dataId) {
        return toSensorDataResponse(sensorDataRepository.findById(dataId)
                .orElseThrow(() -> new ResourceNotFoundException("SensorData", dataId)));
    }

    public List<SensorDataResponse> getDataBySensor(Long sensorId) {
        findSensorById(sensorId); // validate sensor exists
        return sensorDataRepository.findBySensorId(sensorId).stream()
                .map(this::toSensorDataResponse)
                .collect(Collectors.toList());
    }

    public List<SensorDataResponse> getAllSensorData() {
        return sensorDataRepository.findAll().stream()
                .map(this::toSensorDataResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteSensorData(Long dataId) {
        if (!sensorDataRepository.existsById(dataId)) {
            throw new ResourceNotFoundException("SensorData", dataId);
        }
        // Delete linked analyses first
        analysisRepository.findAllByDataId(dataId)
                .forEach(a -> analysisRepository.deleteById(a.getAnalysisId()));
        sensorDataRepository.deleteById(dataId);
    }

    // ─── Analysis ─────────────────────────────────────────────────

    @Transactional
    public AnalysisResponse createAnalysis(AnalysisRequest request) {
        // Validate sensor data exists
        SensorData data = sensorDataRepository.findById(request.getDataId())
                .orElseThrow(() -> new ResourceNotFoundException("SensorData", request.getDataId()));

        Analysis analysis = Analysis.builder()
                .dataId(request.getDataId())
                .sensorId(data.getSensorId())
                .scientistId(request.getScientistId())
                .findings(request.getFindings())
                .status(request.getStatus() != null ? request.getStatus() : AnalysisStatus.PENDING)
                .build();
        return toAnalysisResponse(analysisRepository.save(analysis));
    }

    public List<AnalysisResponse> getAllAnalyses() {
        return analysisRepository.findAll().stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    public AnalysisResponse getAnalysisById(Long id) {
        return toAnalysisResponse(analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id)));
    }

    public List<AnalysisResponse> getAnalysesByDataId(Long dataId) {
        if (!sensorDataRepository.existsById(dataId)) {
            throw new ResourceNotFoundException("SensorData", dataId);
        }
        return analysisRepository.findAllByDataId(dataId).stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    public List<AnalysisResponse> getAnalysesByStatus(AnalysisStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        return analysisRepository.findByStatus(status).stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    public List<AnalysisResponse> getAnalysesBySensor(Long sensorId) {
        findSensorById(sensorId);
        return analysisRepository.findBySensorId(sensorId).stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    public List<AnalysisResponse> getAnalysesByScientist(Long scientistId) {
        return analysisRepository.findByScientistId(scientistId).stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnalysisResponse reviewAnalysis(Long id, Long scientistId, String findings) {
        if (scientistId == null) {
            throw new BadRequestException("Scientist ID is required for review");
        }
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id));

        if (analysis.getStatus() == AnalysisStatus.REVIEWED) {
            throw new BadRequestException("Analysis already reviewed");
        }

        analysis.setScientistId(scientistId);
        analysis.setStatus(AnalysisStatus.REVIEWED);
        if (findings != null && !findings.isBlank()) {
            analysis.setFindings(findings);
        }
        analysis = analysisRepository.save(analysis);

        // Publish async Kafka event — does not affect response
        try {
            eventProducer.publishAnalysisCompleted(scientistId, analysis.getAnalysisId(), analysis.getSensorId());
        } catch (Exception e) {
            log.error("Kafka publish failed for analysisId={}: {}", analysis.getAnalysisId(), e.getMessage());
        }

        return toAnalysisResponse(analysis);
    }

    @Transactional
    public AnalysisResponse updateAnalysisStatus(Long id, AnalysisStatus status) {
        if (status == null) {
            throw new BadRequestException("Status is required");
        }
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id));
        analysis.setStatus(status);
        return toAnalysisResponse(analysisRepository.save(analysis));
    }

    @Transactional
    public void deleteAnalysis(Long id) {
        if (!analysisRepository.existsById(id)) {
            throw new ResourceNotFoundException("Analysis", id);
        }
        analysisRepository.deleteById(id);
    }

    // ─── Private Helpers ─────────────────────────────────────────

    private Sensor findSensorById(Long id) {
        return sensorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sensor", id));
    }

    private void triggerAutoAnalysis(SensorData data) {
        try {
            Sensor sensor = findSensorById(data.getSensorId());
            String findings = generateFindings(data, sensor);
            boolean hasViolation = findings.contains("[UNHEALTHY]") || findings.contains("[HAZARDOUS]")
                    || findings.contains("[POOR]") || findings.contains("[SEVERE]");

            Analysis analysis = Analysis.builder()
                    .dataId(data.getDataId())
                    .sensorId(data.getSensorId())
                    .findings(findings)
                    .status(hasViolation ? AnalysisStatus.FLAGGED : AnalysisStatus.PENDING)
                    .build();
            analysisRepository.save(analysis);
            log.info("Auto-analysis triggered for sensorData id={}, flagged={}", data.getDataId(), hasViolation);
        } catch (Exception e) {
            log.error("Failed to trigger auto-analysis for dataId={}: {}", data.getDataId(), e.getMessage());
        }
    }

    private String generateFindings(SensorData data, Sensor sensor) {
        String json = data.getParametersJson();
        StringBuilder sb = new StringBuilder();
        sb.append("=== EcoTrack Auto-Analysis Report ===\n");
        sb.append("Sensor ID: ").append(data.getSensorId())
          .append(" | Type: ").append(sensor.getType())
          .append(" | Location: ").append(sensor.getLocation()).append("\n");
        sb.append("Data ID: ").append(data.getDataId())
          .append(" | Recorded At: ").append(data.getTimestamp()).append("\n");
        sb.append("-------------------------------------\n");

        if (json == null || json.isBlank()) {
            sb.append("No parameters found in data.\n");
            return sb.toString();
        }

        java.util.Map<String, Double> params = parseJsonToMap(json);

        if (params.isEmpty()) {
            sb.append("Could not parse numeric parameters from data.\n");
            sb.append("Raw: ").append(json).append("\n");
            return sb.toString();
        }

        boolean hasViolation = false;
        sb.append("PARAMETER ANALYSIS:\n\n");

        if (sensor.getType() == SensorType.AIR) {
            hasViolation |= analyzeParam(sb, params, "pm25", "PM2.5 (ug/m3)", 12.0, 35.4, 55.4, 150.4, false);
            hasViolation |= analyzeParam(sb, params, "pm10", "PM10 (ug/m3)", 20.0, 50.0, 150.0, 250.0, false);
            hasViolation |= analyzeParam(sb, params, "CO2", "CO2 (ppm)", 400.0, 800.0, 1000.0, 2000.0, false);
            hasViolation |= analyzeParam(sb, params, "NO2", "NO2 (ppb)", 20.0, 40.0, 80.0, 150.0, false);
            hasViolation |= analyzeParam(sb, params, "SO2", "SO2 (ppb)", 10.0, 20.0, 40.0, 75.0, false);
            hasViolation |= analyzeParam(sb, params, "O3", "Ozone O3 (ppb)", 50.0, 70.0, 85.0, 105.0, false);
        } else if (sensor.getType() == SensorType.WATER) {
            analyzeWaterPh(sb, params);
            hasViolation |= analyzeParam(sb, params, "dissolvedOxygen", "Dissolved Oxygen (mg/L)", 8.0, 6.0, 4.0, 2.0, true);
            hasViolation |= analyzeParam(sb, params, "turbidity", "Turbidity (NTU)", 1.0, 5.0, 10.0, 25.0, false);
            hasViolation |= analyzeParam(sb, params, "conductivity", "Conductivity (uS/cm)", 300.0, 500.0, 800.0, 1200.0, false);
            hasViolation |= analyzeParam(sb, params, "temperature", "Temperature (C)", 20.0, 25.0, 30.0, 35.0, false);
            hasViolation |= analyzeParam(sb, params, "BOD", "BOD (mg/L)", 2.0, 5.0, 8.0, 15.0, false);
        } else if (sensor.getType() == SensorType.NOISE) {
            hasViolation |= analyzeParam(sb, params, "decibel", "Noise Level (dB)", 55.0, 70.0, 85.0, 100.0, false);
        }

        for (java.util.Map.Entry<String, Double> entry : params.entrySet()) {
            sb.append("  * ").append(entry.getKey()).append(": ").append(entry.getValue()).append(" (no threshold defined)\n");
        }

        sb.append("\n-------------------------------------\n");
        sb.append("OVERALL STATUS: ").append(hasViolation
                ? "!! REQUIRES ATTENTION - Scientist review recommended"
                : "OK - ALL PARAMETERS WITHIN SAFE LIMITS").append("\n");
        sb.append("Scientist Review: PENDING\n");
        sb.append("=====================================\n");

        return sb.toString();
    }

    private boolean analyzeParam(StringBuilder sb, java.util.Map<String, Double> params,
                                  String key, String label,
                                  double good, double moderate, double unhealthy, double hazardous,
                                  boolean inverted) {
        Double value = params.remove(key);
        if (value == null) return false;

        String severity;
        boolean violation = false;

        if (inverted) {
            if (value >= good) severity = "[GOOD]";
            else if (value >= moderate) severity = "[MODERATE]";
            else if (value >= unhealthy) { severity = "[POOR]"; violation = true; }
            else { severity = "[SEVERE]"; violation = true; }
        } else {
            if (value <= good) severity = "[GOOD]";
            else if (value <= moderate) severity = "[MODERATE]";
            else if (value <= unhealthy) { severity = "[UNHEALTHY]"; violation = true; }
            else { severity = "[HAZARDOUS]"; violation = true; }
        }

        sb.append("  * ").append(label).append(": ").append(value)
          .append("  ->  ").append(severity);

        if (inverted) {
            sb.append("  (Good: >=").append(good).append(" | Moderate: >=").append(moderate)
              .append(" | Poor: >=").append(unhealthy).append(" | Severe: <").append(unhealthy).append(")");
        } else {
            sb.append("  (Good: <=").append(good).append(" | Moderate: <=").append(moderate)
              .append(" | Unhealthy: <=").append(unhealthy).append(" | Hazardous: >").append(hazardous).append(")");
        }
        sb.append("\n");
        return violation;
    }

    private void analyzeWaterPh(StringBuilder sb, java.util.Map<String, Double> params) {
        Double ph = params.remove("pH");
        if (ph == null) ph = params.remove("ph");
        if (ph == null) return;

        String severity;
        if (ph >= 6.5 && ph <= 8.5) severity = "[GOOD] (Normal range 6.5-8.5)";
        else if (ph >= 6.0 && ph <= 9.0) severity = "[MODERATE] (Slightly outside normal)";
        else if (ph >= 5.0 && ph <= 10.0) severity = "[UNHEALTHY] (Significantly abnormal)";
        else severity = "[HAZARDOUS] (Extreme pH level)";

        sb.append("  * pH Level: ").append(ph).append("  ->  ").append(severity).append("\n");
    }

    private java.util.Map<String, Double> parseJsonToMap(String json) {
        java.util.Map<String, Double> map = new java.util.LinkedHashMap<>();
        try {
            String cleaned = json.trim();
            if (cleaned.startsWith("{")) cleaned = cleaned.substring(1);
            if (cleaned.endsWith("}")) cleaned = cleaned.substring(0, cleaned.length() - 1);

            String[] pairs = cleaned.split(",");
            for (String pair : pairs) {
                String[] kv = pair.split(":", 2);
                if (kv.length == 2) {
                    String key = kv[0].trim().replace("\"", "");
                    String val = kv[1].trim().replace("\"", "");
                    try {
                        map.put(key, Double.parseDouble(val));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse parameters JSON: {}", e.getMessage());
        }
        return map;
    }

    // ─── Mappers ─────────────────────────────────────────────────

    private SensorResponse toSensorResponse(Sensor s) {
        return SensorResponse.builder()
                .sensorId(s.getSensorId())
                .location(s.getLocation())
                .type(s.getType())
                .status(s.getStatus())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }

    private SensorDataResponse toSensorDataResponse(SensorData d) {
        return SensorDataResponse.builder()
                .dataId(d.getDataId())
                .sensorId(d.getSensorId())
                .parametersJson(d.getParametersJson())
                .timestamp(d.getTimestamp())
                .build();
    }

    private AnalysisResponse toAnalysisResponse(Analysis a) {
        return AnalysisResponse.builder()
                .analysisId(a.getAnalysisId())
                .dataId(a.getDataId())
                .sensorId(a.getSensorId())
                .scientistId(a.getScientistId())
                .findings(a.getFindings())
                .date(a.getDate())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
