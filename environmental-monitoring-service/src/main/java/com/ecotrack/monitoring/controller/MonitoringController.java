package com.ecotrack.monitoring.controller;

import com.ecotrack.monitoring.dto.*;
import com.ecotrack.monitoring.enums.AnalysisStatus;
import com.ecotrack.monitoring.enums.SensorStatus;
import com.ecotrack.monitoring.enums.SensorType;
import com.ecotrack.monitoring.service.CsvParserService;
import com.ecotrack.monitoring.service.MonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Environmental Monitoring", description = "Sensor, SensorData, Analysis and CSV upload APIs")
public class MonitoringController {

    private final MonitoringService monitoringService;
    private final CsvParserService csvParserService;

    // ─── Sensor Endpoints ────────────────────────────────────────

    @PostMapping("/api/v1/sensors")
    @Operation(summary = "Register a new sensor")
    public ResponseEntity<SensorResponse> createSensor(@Valid @RequestBody SensorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.createSensor(request));
    }

    @GetMapping("/api/v1/sensors")
    @Operation(summary = "Get all sensors")
    public ResponseEntity<List<SensorResponse>> getAllSensors() {
        return ResponseEntity.ok(monitoringService.getAllSensors());
    }

    @GetMapping("/api/v1/sensors/{id}")
    @Operation(summary = "Get sensor by ID")
    public ResponseEntity<SensorResponse> getSensorById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(monitoringService.getSensorById(id));
    }

    @GetMapping("/api/v1/sensors/type/{type}")
    @Operation(summary = "Get sensors by type (AIR, WATER, NOISE)")
    public ResponseEntity<List<SensorResponse>> getSensorsByType(@PathVariable("type") SensorType type) {
        return ResponseEntity.ok(monitoringService.getSensorsByType(type));
    }

    @PatchMapping("/api/v1/sensors/{id}")
    @Operation(summary = "Update sensor location or type")
    public ResponseEntity<SensorResponse> updateSensor(@PathVariable("id") Long id,
                                                        @RequestBody SensorRequest request) {
        return ResponseEntity.ok(monitoringService.updateSensor(id, request));
    }

    @PatchMapping("/api/v1/sensors/{id}/status")
    @Operation(summary = "Update sensor status (ACTIVE, INACTIVE, MAINTENANCE)")
    public ResponseEntity<SensorResponse> updateSensorStatus(@PathVariable("id") Long id,
                                                              @RequestParam("status") SensorStatus status) {
        return ResponseEntity.ok(monitoringService.updateSensorStatus(id, status));
    }

    @DeleteMapping("/api/v1/sensors/{id}")
    @Operation(summary = "Delete sensor and all its data")
    public ResponseEntity<Void> deleteSensor(@PathVariable("id") Long id) {
        monitoringService.deleteSensor(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Sensor Data Endpoints ───────────────────────────────────

    @PostMapping("/api/v1/sensor-data")
    @Operation(summary = "Submit sensor data reading (auto-triggers analysis)")
    public ResponseEntity<SensorDataResponse> addSensorData(@Valid @RequestBody SensorDataRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.addSensorData(request));
    }

    @GetMapping("/api/v1/sensor-data")
    @Operation(summary = "Get all sensor data readings")
    public ResponseEntity<List<SensorDataResponse>> getAllSensorData() {
        return ResponseEntity.ok(monitoringService.getAllSensorData());
    }

    @GetMapping("/api/v1/sensor-data/{dataId}")
    @Operation(summary = "Get sensor data by ID")
    public ResponseEntity<SensorDataResponse> getSensorDataById(@PathVariable("dataId") Long dataId) {
        return ResponseEntity.ok(monitoringService.getSensorDataById(dataId));
    }

    @GetMapping("/api/v1/sensor-data/sensor/{sensorId}")
    @Operation(summary = "Get all data readings for a specific sensor")
    public ResponseEntity<List<SensorDataResponse>> getDataBySensor(@PathVariable("sensorId") Long sensorId) {
        return ResponseEntity.ok(monitoringService.getDataBySensor(sensorId));
    }

    @DeleteMapping("/api/v1/sensor-data/{dataId}")
    @Operation(summary = "Delete sensor data and linked analyses")
    public ResponseEntity<Void> deleteSensorData(@PathVariable("dataId") Long dataId) {
        monitoringService.deleteSensorData(dataId);
        return ResponseEntity.noContent().build();
    }

    // ─── CSV Upload ──────────────────────────────────────────────

    @PostMapping(value = "/api/v1/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CSV file for bulk sensor data ingestion")
    public ResponseEntity<CsvUploadResponse> uploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam("sensorId") Long sensorId,
            @RequestParam("sensorType") SensorType sensorType) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(csvParserService.parseCsvAndStore(file, sensorId, sensorType));
    }

    // ─── Analysis Endpoints ──────────────────────────────────────

    @PostMapping("/api/v1/analysis")
    @Operation(summary = "Manually create an analysis record")
    public ResponseEntity<AnalysisResponse> createAnalysis(@Valid @RequestBody AnalysisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.createAnalysis(request));
    }

    @GetMapping("/api/v1/analysis")
    @Operation(summary = "Get all analysis records")
    public ResponseEntity<List<AnalysisResponse>> getAllAnalyses() {
        return ResponseEntity.ok(monitoringService.getAllAnalyses());
    }

    @GetMapping("/api/v1/analysis/{id}")
    @Operation(summary = "Get analysis by ID")
    public ResponseEntity<AnalysisResponse> getAnalysisById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(monitoringService.getAnalysisById(id));
    }

    @GetMapping("/api/v1/analysis/data/{dataId}")
    @Operation(summary = "Get all analyses for a sensor data record")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesByDataId(@PathVariable("dataId") Long dataId) {
        return ResponseEntity.ok(monitoringService.getAnalysesByDataId(dataId));
    }

    @GetMapping("/api/v1/analysis/status/{status}")
    @Operation(summary = "Get analyses by status (PENDING, REVIEWED, FLAGGED)")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesByStatus(@PathVariable("status") AnalysisStatus status) {
        return ResponseEntity.ok(monitoringService.getAnalysesByStatus(status));
    }

    @GetMapping("/api/v1/analysis/sensor/{sensorId}")
    @Operation(summary = "Get all analyses for a specific sensor")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesBySensor(@PathVariable("sensorId") Long sensorId) {
        return ResponseEntity.ok(monitoringService.getAnalysesBySensor(sensorId));
    }

    @GetMapping("/api/v1/analysis/scientist/{scientistId}")
    @Operation(summary = "Get all analyses reviewed by a scientist")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesByScientist(@PathVariable("scientistId") Long scientistId) {
        return ResponseEntity.ok(monitoringService.getAnalysesByScientist(scientistId));
    }

    @PatchMapping("/api/v1/analysis/{id}/review")
    @Operation(summary = "Mark analysis as reviewed by scientist (sets status=REVIEWED)")
    public ResponseEntity<AnalysisResponse> reviewAnalysis(
            @PathVariable("id") Long id,
            @RequestParam("scientistId") Long scientistId,
            @RequestParam(value = "findings", required = false) String findings) {
        return ResponseEntity.ok(monitoringService.reviewAnalysis(id, scientistId, findings));
    }

    @PatchMapping("/api/v1/analysis/{id}/status")
    @Operation(summary = "Update analysis status (PENDING, REVIEWED, FLAGGED)")
    public ResponseEntity<AnalysisResponse> updateAnalysisStatus(
            @PathVariable("id") Long id,
            @RequestParam("status") AnalysisStatus status) {
        return ResponseEntity.ok(monitoringService.updateAnalysisStatus(id, status));
    }

    @DeleteMapping("/api/v1/analysis/{id}")
    @Operation(summary = "Delete an analysis record")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable("id") Long id) {
        monitoringService.deleteAnalysis(id);
        return ResponseEntity.noContent().build();
    }
}
