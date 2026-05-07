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
import com.ecotrack.monitoring.exception.ScientistNotFoundException;
import com.ecotrack.monitoring.exception.UnauthorizedException;
import com.ecotrack.monitoring.repository.AnalysisRepository;
import com.ecotrack.monitoring.repository.SensorDataRepository;
import com.ecotrack.monitoring.repository.SensorRepository;
import com.ecotrack.monitoring.feign.IamServiceClient;
import com.ecotrack.monitoring.feign.UserDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MonitoringService {

    private final SensorRepository sensorRepository;
    private final SensorDataRepository sensorDataRepository;
    private final AnalysisRepository analysisRepository;
    private final IamServiceClient iamServiceClient;

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
    public SensorResponse updateSensorLocation(Long id, String location) {
        if (location == null || location.trim().isEmpty()) {
            throw new BadRequestException("Location is required");
        }
        Sensor sensor = findSensorById(id);
        sensor.setLocation(location);
        return toSensorResponse(sensorRepository.save(sensor));
    }

    @Transactional
    public SensorResponse updateSensorType(Long id, SensorType type) {
        if (type == null) {
            throw new BadRequestException("Type is required");
        }
        Sensor sensor = findSensorById(id);
        sensor.setType(type);
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
                .value(request.getValue())
                .unit(request.getUnit())
                .parametersJson(request.getParametersJson())
                .recordedAt(request.getRecordedAt())
                .notes(request.getNotes())
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
        List<SensorData> results = sensorDataRepository.findBySensorId(sensorId);
        if (results.isEmpty()) {
            throw new ResourceNotFoundException("No sensor data found for sensor id: " + sensorId);
        }
        return results.stream()
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
        // Fetch sensor data
        SensorData data = sensorDataRepository.findById(request.getDataId())
                .orElseThrow(() -> new ResourceNotFoundException("SensorData", request.getDataId()));

        // Generate findings from parametersJson if not provided in request
        String findings = (request.getFindings() != null && !request.getFindings().isBlank())
                ? request.getFindings()
                : generateFindings(data.getParametersJson());
        // Assign scientistId: from request → IAM fetch → null default
        Long scientistId = request.getScientistId();
        if (scientistId == null) {
            scientistId = assignScientist();
        }
        // Keep as null if no scientist available

        // Determine status based on whether findings contain issues
        AnalysisStatus status = request.getStatus();
        if (status == null) {
            boolean hasViolation = !findings.equals("All environmental parameters are within safe limits");
            status = hasViolation ? AnalysisStatus.FLAGGED : AnalysisStatus.PENDING;
        }

        Analysis analysis = Analysis.builder()
                .dataId(request.getDataId())
                .sensorId(data.getSensorId())
                .scientistId(scientistId)
                .findings(findings)
                .status(status)
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
        List<Analysis> results = analysisRepository.findAllByDataId(dataId);
        if (results.isEmpty()) {
            throw new ResourceNotFoundException("No analysis records found for sensor data id: " + dataId);
        }
        return results.stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AnalysisResponse reviewAnalysis(Long id, String userId, String userRole, AnalysisStatus status, String findings) {
        // ── Validate that the caller is a SCIENTIST ──────────────────────────
        if (userRole == null || !userRole.equalsIgnoreCase("SCIENTIST")) {
            throw new UnauthorizedException("Only SCIENTIST role can review analysis. Your role: " + userRole);
        }
        if (userId == null || userId.isBlank()) {
            throw new UnauthorizedException("User ID is missing from request. Please login again.");
        }

        Long scientistId;
        try {
            scientistId = Long.parseLong(userId);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Invalid user ID in token: " + userId);
        }

        if (status == null || status == AnalysisStatus.PENDING) {
            throw new BadRequestException("Status must be REVIEWED or FLAGGED");
        }

        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis", id));

        // Auto-assign scientistId from JWT — no manual override allowed
        analysis.setScientistId(scientistId);
        analysis.setStatus(status);
        if (findings != null && !findings.isBlank()) {
            analysis.setFindings(findings);
        }
        analysis = analysisRepository.save(analysis);


        return toAnalysisResponse(analysis);
    }


    public List<AnalysisResponse> getAnalysisByScientistId(Long scientistId) {
        List<Analysis> results = analysisRepository.findByScientistId(scientistId);
        if (results.isEmpty()) {
            throw new ScientistNotFoundException(scientistId);
        }
        return results.stream()
                .map(this::toAnalysisResponse)
                .collect(Collectors.toList());
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
            String findings = generateFindings(data.getParametersJson());
            boolean hasViolation = !findings.equals("All environmental parameters are within safe limits");

            Long scientistId = assignScientist();
            // Keep as null if no scientist available

            Analysis analysis = Analysis.builder()
                    .dataId(data.getDataId())
                    .sensorId(data.getSensorId())
                    .scientistId(scientistId)
                    .findings(findings)
                    .status(hasViolation ? AnalysisStatus.FLAGGED : AnalysisStatus.PENDING)
                    .build();
            analysisRepository.save(analysis);
            log.info("Auto-analysis triggered for sensorData id={}, flagged={}, scientistId={}", data.getDataId(), hasViolation, scientistId);
        } catch (Exception e) {
            log.error("Failed to trigger auto-analysis for dataId={}: {}", data.getDataId(), e.getMessage());
        }
    }

    private Long assignScientist() {
        try {
            List<UserDto> scientists = iamServiceClient.getUsersByRole("SCIENTIST");
            if (scientists != null && !scientists.isEmpty()) {
                // Round-robin: pick scientist based on current analysis count
                long totalAnalyses = analysisRepository.count();
                int index = (int) (totalAnalyses % scientists.size());
                Long selectedId = scientists.get(index).getUserId();
                log.info("Auto-assigned scientist userId={} for analysis", selectedId);
                return selectedId;
            }
        } catch (Exception e) {
            log.warn("Could not fetch scientists from IAM service: {}", e.getMessage());
        }
        return null;
    }

    /**
     * Generates a clean, concise findings string based on threshold rules applied to sensor parameters.
     * Returns a comma-separated list of issues, or a "safe" message if all values are within limits.
     */
    private String generateFindings(String parametersJson) {
        java.util.Map<String, Double> params = parseJsonToMap(parametersJson);
        java.util.List<String> parts = new java.util.ArrayList<>();

        // ── Air Parameters ──────────────────────────────────────────
        addFinding(parts, params, "CO2",         "CO2",         new double[]{2000, 1000, 800, 400});
        addFinding(parts, params, "NO2",         "NO2",         new double[]{150,  80,   40,  20});
        addFinding(parts, params, "SO2",         "SO2",         new double[]{75,   40,   20,  10});
        addFinding(parts, params, "O3",          "ozone",       new double[]{105,  85,   70,  50});
        addFinding(parts, params, "pm25",        "PM2.5",       new double[]{150,  55,   35,  12});
        addFinding(parts, params, "pm10",        "PM10",        new double[]{250,  150,  50,  20});

        // ── Water Parameters ────────────────────────────────────────
        Double ph = params.get("pH") != null ? params.get("pH") : params.get("ph");
        if (ph != null) {
            String label;
            if (ph < 5.0 || ph > 10.0)      label = "hazardous";
            else if (ph < 6.0 || ph > 9.0)  label = "high";
            else if (ph < 6.5 || ph > 8.5)  label = "moderate";
            else                             label = "normal";
            parts.add("pH levels are " + label);
        }

        Double dox = params.get("dissolvedOxygen");
        if (dox != null) {
            String label;
            if (dox < 2.0)      label = "critically low";
            else if (dox < 4.0) label = "low";
            else if (dox < 6.0) label = "slightly low";
            else                label = "normal";
            parts.add("dissolved oxygen is " + label);
        }

        addFinding(parts, params, "turbidity",    "turbidity",    new double[]{25,   15,   10,  5});
        addFinding(parts, params, "conductivity", "conductivity", new double[]{1200, 800,  500, 200});
        addFinding(parts, params, "BOD",          "BOD",          new double[]{15,   10,   5,   2});

        // ── Noise & Temperature ─────────────────────────────────────
        addFinding(parts, params, "decibel",     "noise",        new double[]{100,  85,   70,  60});
        addFinding(parts, params, "temperature", "temperature",  new double[]{40,   35,   30,  25});

        if (parts.isEmpty()) {
            return "All environmental parameters are within safe limits";
        }
        return String.join(", ", parts);
    }

    /** Evaluates a parameter against four thresholds and adds a concise finding. */
    private void addFinding(java.util.List<String> parts, java.util.Map<String, Double> params,
                            String key, String label, double[] t) {
        Double v = params.get(key);
        if (v == null) return;
        String status;
        if      (v > t[0]) status = "hazardous";
        else if (v > t[1]) status = "high";
        else if (v > t[2]) status = "moderate";
        else if (v > t[3]) status = "slightly elevated";
        else               status = "normal";
        parts.add(label + " levels are " + status);
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
                .id(d.getDataId())
                .dataId(d.getDataId())
                .sensorId(d.getSensorId())
                .value(d.getValue())
                .unit(d.getUnit())
                .parametersJson(d.getParametersJson())
                .recordedAt(d.getRecordedAt())
                .timestamp(d.getTimestamp())
                .notes(d.getNotes())
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
