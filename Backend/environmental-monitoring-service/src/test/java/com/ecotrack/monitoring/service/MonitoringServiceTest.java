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
import com.ecotrack.monitoring.exception.UnauthorizedException;
import com.ecotrack.monitoring.feign.IamServiceClient;
import com.ecotrack.monitoring.feign.NotificationCategory;
import com.ecotrack.monitoring.feign.NotificationClient;
import com.ecotrack.monitoring.feign.UserDto;
import com.ecotrack.monitoring.repository.AnalysisRepository;
import com.ecotrack.monitoring.repository.SensorDataRepository;
import com.ecotrack.monitoring.repository.SensorRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MonitoringServiceTest {

    @Mock
    private SensorRepository sensorRepository;

    @Mock
    private SensorDataRepository sensorDataRepository;

    @Mock
    private AnalysisRepository analysisRepository;

    @Mock
    private IamServiceClient iamServiceClient;

    @Mock
    private NotificationClient notificationClient;

    @InjectMocks
    private MonitoringService monitoringService;

    private Sensor testSensor;
    private SensorData testSensorData;
    private Analysis testAnalysis;
    private UserDto testOfficer;
    private UserDto testScientist;

    @BeforeEach
    void setUp() {
        // Initialize test data
        testSensor = Sensor.builder()
                .sensorId(1L)
                .location("Downtown Market Area")
                .type(SensorType.AIR)
                .status(SensorStatus.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testSensorData = SensorData.builder()
                .dataId(1L)
                .sensorId(1L)
                .parametersJson("{\"pm25\": 45.5, \"pm10\": 75.2, \"CO2\": 420}")
                .recordedAt(LocalDateTime.now())
                .timestamp(LocalDateTime.now())
                .notes("Morning reading")
                .build();

        testAnalysis = Analysis.builder()
                .analysisId(1L)
                .dataId(1L)
                .sensorId(1L)
                .agencyOfficerId(null)
                .findings("PM2.5 levels are slightly elevated")
                .status(AnalysisStatus.PENDING)
                .date(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        testOfficer = UserDto.builder()
                .userId(2L)
                .name("John Smith")
                .email("john@ecotrack.com")
                .role("AGENCY_OFFICER")
                .build();

        testScientist = UserDto.builder()
                .userId(3L)
                .name("Dr. Sarah")
                .email("sarah@ecotrack.com")
                .role("SCIENTIST")
                .build();
    }

    // ──── SENSOR TESTS ────────────────────────────────────

    @Test
    void testCreateSensor_Success() {
        // Arrange
        SensorRequest request = new SensorRequest();
        request.setLocation("River Area");
        request.setType(SensorType.WATER);

        Sensor savedSensor = Sensor.builder()
                .sensorId(5L)
                .location("River Area")
                .type(SensorType.WATER)
                .status(SensorStatus.ACTIVE)
                .build();

        when(sensorRepository.save(any(Sensor.class))).thenReturn(savedSensor);

        // Act
        SensorResponse response = monitoringService.createSensor(request);

        // Assert
        assertNotNull(response);
        assertEquals(5L, response.getSensorId());
        assertEquals("River Area", response.getLocation());
        assertEquals(SensorType.WATER, response.getType());
        verify(sensorRepository, times(1)).save(any(Sensor.class));
    }

    @Test
    void testCreateSensor_NullRequest_ThrowsException() {
        // Act & Assert
        assertThrows(BadRequestException.class, () -> monitoringService.createSensor(null));
    }

    @Test
    void testCreateSensor_EmptyLocation_ThrowsException() {
        // Arrange
        SensorRequest request = new SensorRequest();
        request.setLocation("");
        request.setType(SensorType.AIR);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> monitoringService.createSensor(request));
    }

    @Test
    void testCreateSensor_NullType_ThrowsException() {
        // Arrange
        SensorRequest request = new SensorRequest();
        request.setLocation("Test Location");
        request.setType(null);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> monitoringService.createSensor(request));
    }

    @Test
    void testGetAllSensors_Success() {
        // Arrange
        List<Sensor> sensors = Arrays.asList(testSensor, testSensor);
        when(sensorRepository.findAll()).thenReturn(sensors);

        // Act
        List<SensorResponse> responses = monitoringService.getAllSensors();

        // Assert
        assertNotNull(responses);
        assertEquals(2, responses.size());
        verify(sensorRepository, times(1)).findAll();
    }

    @Test
    void testGetSensorById_Success() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));

        // Act
        SensorResponse response = monitoringService.getSensorById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getSensorId());
        assertEquals("Downtown Market Area", response.getLocation());
        verify(sensorRepository, times(1)).findById(1L);
    }

    @Test
    void testGetSensorById_NotFound_ThrowsException() {
        // Arrange
        when(sensorRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> monitoringService.getSensorById(999L));
    }

    @Test
    void testUpdateSensorStatus_Success() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorRepository.save(any(Sensor.class))).thenReturn(testSensor);

        // Act
        SensorResponse response = monitoringService.updateSensorStatus(1L, SensorStatus.INACTIVE);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getSensorId());
        verify(sensorRepository, times(1)).save(any(Sensor.class));
    }

    @Test
    void testUpdateSensorStatus_NullStatus_ThrowsException() {
        // Act & Assert
        assertThrows(BadRequestException.class, () -> monitoringService.updateSensorStatus(1L, null));
    }

    @Test
    void testDeleteSensor_Success() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorDataRepository.findBySensorId(1L)).thenReturn(Arrays.asList(testSensorData));
        when(analysisRepository.findAllByDataId(1L)).thenReturn(Arrays.asList(testAnalysis));

        // Act
        monitoringService.deleteSensor(1L);

        // Assert
        verify(sensorRepository, times(1)).deleteById(1L);
        verify(sensorDataRepository, times(1)).deleteById(1L);
        verify(analysisRepository, times(1)).deleteById(1L);
    }

    // ──── SENSOR DATA TESTS ────────────────────────────────

    @Test
    void testAddSensorData_Success() {
        // Arrange
        SensorDataRequest request = new SensorDataRequest();
        request.setSensorId(1L);
        request.setParametersJson("{\"pm25\": 30.5}");
        request.setRecordedAt(LocalDateTime.now());

        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorDataRepository.save(any(SensorData.class))).thenReturn(testSensorData);
        when(analysisRepository.save(any(Analysis.class))).thenReturn(testAnalysis);

        // Act
        SensorDataResponse response = monitoringService.addSensorData(request);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getDataId());
        verify(sensorDataRepository, times(1)).save(any(SensorData.class));
        verify(analysisRepository, times(1)).save(any(Analysis.class)); // Auto-analysis
    }

    @Test
    void testGetSensorDataById_Success() {
        // Arrange
        when(sensorDataRepository.findById(1L)).thenReturn(Optional.of(testSensorData));

        // Act
        SensorDataResponse response = monitoringService.getSensorDataById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getDataId());
        verify(sensorDataRepository, times(1)).findById(1L);
    }

    @Test
    void testGetDataBySensor_Success() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorDataRepository.findBySensorId(1L)).thenReturn(Arrays.asList(testSensorData));

        // Act
        List<SensorDataResponse> responses = monitoringService.getDataBySensor(1L);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(sensorDataRepository, times(1)).findBySensorId(1L);
    }

    @Test
    void testGetDataBySensor_NoData_ThrowsException() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorDataRepository.findBySensorId(1L)).thenReturn(Arrays.asList());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> monitoringService.getDataBySensor(1L));
    }

    @Test
    void testDeleteSensorData_Success() {
        // Arrange
        when(sensorDataRepository.existsById(1L)).thenReturn(true);
        when(analysisRepository.findAllByDataId(1L)).thenReturn(Arrays.asList(testAnalysis));

        // Act
        monitoringService.deleteSensorData(1L);

        // Assert
        verify(sensorDataRepository, times(1)).deleteById(1L);
        verify(analysisRepository, times(1)).deleteById(1L);
    }

    // ──── ANALYSIS TESTS ────────────────────────────────────

    @Test
    void testCreateAnalysis_Success() {
        // Arrange
        AnalysisRequest request = new AnalysisRequest();
        request.setDataId(1L);
        request.setFindings("Test findings");

        when(sensorDataRepository.findById(1L)).thenReturn(Optional.of(testSensorData));
        when(analysisRepository.save(any(Analysis.class))).thenReturn(testAnalysis);

        // Act
        AnalysisResponse response = monitoringService.createAnalysis(request);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getAnalysisId());
        assertNull(response.getAgencyOfficerId()); // Initially null
        verify(analysisRepository, times(1)).save(any(Analysis.class));
    }

    @Test
    void testCreateAnalysis_DataNotFound_ThrowsException() {
        // Arrange
        AnalysisRequest request = new AnalysisRequest();
        request.setDataId(999L);
        request.setFindings("Test findings");

        when(sensorDataRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> monitoringService.createAnalysis(request));
    }

    @Test
    void testGetAllAnalyses_Success() {
        // Arrange
        List<Analysis> analyses = Arrays.asList(testAnalysis);
        when(analysisRepository.findAll()).thenReturn(analyses);

        // Act
        List<AnalysisResponse> responses = monitoringService.getAllAnalyses();

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(analysisRepository, times(1)).findAll();
    }

    @Test
    void testGetAnalysisById_Success() {
        // Arrange
        when(analysisRepository.findById(1L)).thenReturn(Optional.of(testAnalysis));

        // Act
        AnalysisResponse response = monitoringService.getAnalysisById(1L);

        // Assert
        assertNotNull(response);
        assertEquals(1L, response.getAnalysisId());
        verify(analysisRepository, times(1)).findById(1L);
    }

    @Test
    void testReviewAnalysis_Success() {
        // Arrange
        when(analysisRepository.findById(1L)).thenReturn(Optional.of(testAnalysis));
        when(analysisRepository.save(any(Analysis.class))).thenReturn(testAnalysis);
        when(iamServiceClient.getUserById(2L)).thenReturn(testOfficer);
        when(iamServiceClient.getUsersByRole("SCIENTIST")).thenReturn(Arrays.asList(testScientist));

        // Act
        AnalysisResponse response = monitoringService.reviewAnalysis(
                1L, "2", "AGENCY_OFFICER", AnalysisStatus.REVIEWED, null);

        // Assert
        assertNotNull(response);
        verify(analysisRepository, times(1)).save(any(Analysis.class));
        verify(notificationClient, times(1)).createNotification(any());
    }

    @Test
    void testReviewAnalysis_InvalidRole_ThrowsException() {
        // Act & Assert
        assertThrows(UnauthorizedException.class, () ->
                monitoringService.reviewAnalysis(1L, "2", "SCIENTIST", AnalysisStatus.REVIEWED, null));
    }

    @Test
    void testReviewAnalysis_NullUserId_ThrowsException() {
        // Act & Assert
        assertThrows(UnauthorizedException.class, () ->
                monitoringService.reviewAnalysis(1L, null, "AGENCY_OFFICER", AnalysisStatus.REVIEWED, null));
    }

    @Test
    void testReviewAnalysis_InvalidStatus_ThrowsException() {
        // Act & Assert
        assertThrows(BadRequestException.class, () ->
                monitoringService.reviewAnalysis(1L, "2", "AGENCY_OFFICER", AnalysisStatus.PENDING, null));
    }

    @Test
    void testReviewAnalysis_IncludesOfficerNameInNotification() {
        // Arrange
        when(analysisRepository.findById(1L)).thenReturn(Optional.of(testAnalysis));
        when(analysisRepository.save(any(Analysis.class))).thenReturn(testAnalysis);
        when(iamServiceClient.getUserById(2L)).thenReturn(testOfficer);
        when(iamServiceClient.getUsersByRole("SCIENTIST")).thenReturn(Arrays.asList(testScientist));

        // Act
        monitoringService.reviewAnalysis(1L, "2", "AGENCY_OFFICER", AnalysisStatus.REVIEWED, null);

        // Assert - Verify notification message includes officer name
        verify(notificationClient, times(1)).createNotification(argThat(req ->
                req.getMessage().contains("John Smith") && req.getMessage().contains("Analysis #1")
        ));
    }

    @Test
    void testGetAnalysesByDataId_Success() {
        // Arrange
        when(sensorDataRepository.existsById(1L)).thenReturn(true);
        when(analysisRepository.findAllByDataId(1L)).thenReturn(Arrays.asList(testAnalysis));

        // Act
        List<AnalysisResponse> responses = monitoringService.getAnalysesByDataId(1L);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(analysisRepository, times(1)).findAllByDataId(1L);
    }

    @Test
    void testGetAnalysesByStatus_Success() {
        // Arrange
        when(analysisRepository.findByStatus(AnalysisStatus.PENDING))
                .thenReturn(Arrays.asList(testAnalysis));

        // Act
        List<AnalysisResponse> responses = monitoringService.getAnalysisByStatus(AnalysisStatus.PENDING);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(analysisRepository, times(1)).findByStatus(AnalysisStatus.PENDING);
    }

    @Test
    void testGetAnalysesBySensorId_Success() {
        // Arrange
        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(analysisRepository.findBySensorId(1L)).thenReturn(Arrays.asList(testAnalysis));

        // Act
        List<AnalysisResponse> responses = monitoringService.getAnalysisBySensorId(1L);

        // Assert
        assertNotNull(responses);
        assertEquals(1, responses.size());
        verify(analysisRepository, times(1)).findBySensorId(1L);
    }

    @Test
    void testDeleteAnalysis_Success() {
        // Arrange
        when(analysisRepository.existsById(1L)).thenReturn(true);

        // Act
        monitoringService.deleteAnalysis(1L);

        // Assert
        verify(analysisRepository, times(1)).deleteById(1L);
    }

    @Test
    void testDeleteAnalysis_NotFound_ThrowsException() {
        // Arrange
        when(analysisRepository.existsById(999L)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> monitoringService.deleteAnalysis(999L));
    }

    // ──── FINDINGS GENERATION TESTS ────────────────────────

    @Test
    void testGenerateFindings_AllParametersNormal() {
        // Arrange
        String json = "{\"pm25\": 10, \"pm10\": 20, \"CO2\": 400, \"NO2\": 10, \"SO2\": 5, \"O3\": 50}";

        // Act
        AnalysisRequest request = new AnalysisRequest();
        request.setDataId(1L);
        request.setFindings(null);

        when(sensorDataRepository.findById(1L)).thenReturn(Optional.of(
                SensorData.builder()
                        .dataId(1L)
                        .sensorId(1L)
                        .parametersJson(json)
                        .build()
        ));
        when(analysisRepository.save(any(Analysis.class))).thenReturn(
                Analysis.builder()
                        .analysisId(1L)
                        .findings("All environmental parameters are within safe limits")
                        .status(AnalysisStatus.PENDING)
                        .build()
        );

        // Act
        AnalysisResponse response = monitoringService.createAnalysis(request);

        // Assert
        assertNotNull(response);
        assertEquals("All environmental parameters are within safe limits", response.getFindings());
        assertEquals(AnalysisStatus.PENDING, response.getStatus());
    }

    @Test
    void testGenerateFindings_ViolationDetected() {
        // Arrange
        String json = "{\"pm25\": 100, \"pm10\": 150}"; // High pollution

        when(sensorDataRepository.findById(1L)).thenReturn(Optional.of(
                SensorData.builder()
                        .dataId(1L)
                        .sensorId(1L)
                        .parametersJson(json)
                        .build()
        ));

        Analysis flaggedAnalysis = Analysis.builder()
                .analysisId(1L)
                .findings("PM2.5 levels are hazardous, PM10 levels are hazardous")
                .status(AnalysisStatus.FLAGGED) // Should be flagged
                .build();

        when(analysisRepository.save(any(Analysis.class))).thenReturn(flaggedAnalysis);

        // Act
        AnalysisRequest request = new AnalysisRequest();
        request.setDataId(1L);
        request.setFindings(null);
        AnalysisResponse response = monitoringService.createAnalysis(request);

        // Assert
        assertNotNull(response);
        assertEquals(AnalysisStatus.FLAGGED, response.getStatus());
        assertTrue(response.getFindings().contains("hazardous"));
    }

    @Test
    void testAutoAnalysisOnSensorDataSubmission() {
        // Arrange
        SensorDataRequest request = new SensorDataRequest();
        request.setSensorId(1L);
        request.setParametersJson("{\"pm25\": 50}");
        request.setRecordedAt(LocalDateTime.now());

        when(sensorRepository.findById(1L)).thenReturn(Optional.of(testSensor));
        when(sensorDataRepository.save(any(SensorData.class))).thenReturn(testSensorData);
        when(analysisRepository.save(any(Analysis.class))).thenReturn(testAnalysis);
        when(iamServiceClient.getUsersByRole("AGENCY_OFFICER")).thenReturn(Arrays.asList(testOfficer));

        // Act
        SensorDataResponse response = monitoringService.addSensorData(request);

        // Assert
        assertNotNull(response);
        verify(analysisRepository, times(1)).save(any(Analysis.class)); // Auto-analysis created
    }
}





