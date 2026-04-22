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
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<SensorResponse> createSensor(@Valid @RequestBody SensorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.createSensor(request));
    }

    @GetMapping("/api/v1/sensors")
    @Operation(summary = "Get all sensors")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<SensorResponse>> getAllSensors() {
        return ResponseEntity.ok(monitoringService.getAllSensors());
    }

    @GetMapping("/api/v1/sensors/{id}")
    @Operation(summary = "Get sensor by ID")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<SensorResponse> getSensorById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(monitoringService.getSensorById(id));
    }


    @PatchMapping("/api/v1/sensors/{id}/status")
    @Operation(summary = "Update sensor status (ACTIVE, INACTIVE, MAINTENANCE)")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<SensorResponse> updateSensorStatus(@PathVariable("id") Long id,
                                                              @RequestParam("status") SensorStatus status) {
        return ResponseEntity.ok(monitoringService.updateSensorStatus(id, status));
    }

    @DeleteMapping("/api/v1/sensors/{id}")
    @Operation(summary = "Delete sensor and all its data")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<Void> deleteSensor(@PathVariable("id") Long id) {
        monitoringService.deleteSensor(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Sensor Data Endpoints ───────────────────────────────────

    @PostMapping("/api/v1/sensor-data")
    @Operation(summary = "Submit sensor data reading (auto-triggers analysis)")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<SensorDataResponse> addSensorData(@Valid @RequestBody SensorDataRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.addSensorData(request));
    }

    @GetMapping("/api/v1/sensor-data")
    @Operation(summary = "Get all sensor data readings")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<SensorDataResponse>> getAllSensorData() {
        return ResponseEntity.ok(monitoringService.getAllSensorData());
    }

    @GetMapping("/api/v1/sensor-data/{dataId}")
    @Operation(summary = "Get sensor data by ID")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<SensorDataResponse> getSensorDataById(@PathVariable("dataId") Long dataId) {
        return ResponseEntity.ok(monitoringService.getSensorDataById(dataId));
    }

    @GetMapping("/api/v1/sensor-data/sensor/{sensorId}")
    @Operation(summary = "Get all data readings for a specific sensor")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<SensorDataResponse>> getDataBySensor(@PathVariable("sensorId") Long sensorId) {
        return ResponseEntity.ok(monitoringService.getDataBySensor(sensorId));
    }

    @DeleteMapping("/api/v1/sensor-data/{dataId}")
    @Operation(summary = "Delete sensor data and linked analyses")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<Void> deleteSensorData(@PathVariable("dataId") Long dataId) {
        monitoringService.deleteSensorData(dataId);
        return ResponseEntity.noContent().build();
    }

    // ─── CSV Upload ──────────────────────────────────────────────

    @PostMapping(value = "/api/v1/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload CSV file for bulk sensor data ingestion")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
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
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<AnalysisResponse> createAnalysis(@Valid @RequestBody AnalysisRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(monitoringService.createAnalysis(request));
    }

    @GetMapping("/api/v1/analysis")
    @Operation(summary = "Get all analysis records")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<AnalysisResponse>> getAllAnalyses() {
        return ResponseEntity.ok(monitoringService.getAllAnalyses());
    }

    @GetMapping("/api/v1/analysis/{id}")
    @Operation(summary = "Get analysis by ID")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<AnalysisResponse> getAnalysisById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(monitoringService.getAnalysisById(id));
    }

    @GetMapping("/api/v1/analysis/data/{dataId}")
    @Operation(summary = "Get all analyses for a sensor data record")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesByDataId(@PathVariable("dataId") Long dataId) {
        return ResponseEntity.ok(monitoringService.getAnalysesByDataId(dataId));
    }


    @GetMapping("/api/v1/analysis/scientist/{scientistId}")
    @Operation(summary = "Get all analyses assigned to a specific scientist")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<List<AnalysisResponse>> getAnalysisByScientistId(
            @PathVariable("scientistId") Long scientistId) {
        return ResponseEntity.ok(monitoringService.getAnalysisByScientistId(scientistId));
    }

    @PatchMapping("/api/v1/analysis/{id}/review")
    @Operation(summary = "Review analysis — SCIENTIST only. Status: REVIEWED or FLAGGED. ScientistId is auto-read from your login token.")
    @PreAuthorize("hasAnyAuthority('SCIENTIST', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<AnalysisResponse> reviewAnalysis(
            @PathVariable("id") Long id,
            @RequestHeader("X-User-Id")   String userId,
            @RequestHeader("X-User-Role") String userRole,
            @RequestParam(value = "status", defaultValue = "REVIEWED") AnalysisStatus status,
            @RequestParam(value = "findings", required = false) String findings) {
        return ResponseEntity.ok(monitoringService.reviewAnalysis(id, userId, userRole, status, findings));
    }


    @DeleteMapping("/api/v1/analysis/{id}")
    @Operation(summary = "Delete an analysis record")
    @PreAuthorize("hasAnyAuthority('OFFICER', 'SUPER_ADMIN', 'ADMINISTRATOR')")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable("id") Long id) {
        monitoringService.deleteAnalysis(id);
        return ResponseEntity.noContent().build();
    }
}
