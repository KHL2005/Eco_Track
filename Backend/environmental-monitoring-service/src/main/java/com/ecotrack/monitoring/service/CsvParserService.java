package com.ecotrack.monitoring.service;

import com.ecotrack.monitoring.dto.CsvUploadResponse;
import com.ecotrack.monitoring.dto.SensorDataRequest;
import com.ecotrack.monitoring.enums.SensorType;
import com.opencsv.CSVReader;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvParserService {

    private final MonitoringService monitoringService;

    private static final Set<String> AIR_PARAMETERS = Set.of(
            "pm25", "pm2.5", "pm10", "co2", "no2", "so2", "o3",
            "PM25", "PM2.5", "PM10", "CO2", "NO2", "SO2", "O3"
    );

    private static final Set<String> WATER_PARAMETERS = Set.of(
            "ph", "dissolvedoxygen", "turbidity", "conductivity", "temperature", "bod",
            "pH", "dissolvedOxygen", "Turbidity", "Conductivity", "Temperature", "BOD"
    );

    private static final Set<String> NOISE_PARAMETERS = Set.of(
            "decibel", "frequency", "peak_level", "ambient_level", "frequency_range",
            "Decibel", "Frequency", "Peak_Level", "Ambient_Level", "Frequency_Range"
    );

    public CsvUploadResponse parseCsvAndStore(MultipartFile file, Long sensorId, SensorType sensorType) throws Exception {
        int success = 0, fail = 0;
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream()))) {
            String[] headers = reader.readNext();
            if (headers == null) {
                return CsvUploadResponse.builder()
                        .totalRows(0).successCount(0).failCount(0)
                        .message("CSV file is empty.")
                        .build();
            }

            String validationError = validateHeadersForSensorType(headers, sensorType);
            if (validationError != null) {
                return CsvUploadResponse.builder()
                        .totalRows(0).successCount(0).failCount(0)
                        .message(validationError)
                        .build();
            }

            String[] line;
            while ((line = reader.readNext()) != null) {
                try {
                    StringBuilder json = new StringBuilder("{");
                    for (int i = 0; i < line.length && i < headers.length; i++) {
                        json.append("\"").append(headers[i].trim()).append("\":\"").append(line[i].trim()).append("\"");
                        if (i < line.length - 1 && i < headers.length - 1) json.append(",");
                    }
                    json.append("}");
                    SensorDataRequest request = new SensorDataRequest();
                    request.setSensorId(sensorId);
                    request.setParametersJson(json.toString());
                    monitoringService.addSensorData(request);
                    success++;
                } catch (Exception e) {
                    log.error("CSV row failed: {}", e.getMessage(), e);
                    fail++;
                }
            }
        }
        int total = success + fail;
        return CsvUploadResponse.builder()
                .totalRows(total).successCount(success).failCount(fail)
                .message("CSV processed: " + success + " records saved, " + fail + " failed.")
                .build();
    }

    private String validateHeadersForSensorType(String[] headers, SensorType sensorType) {
        if (headers == null || headers.length == 0) {
            return "CSV headers are empty.";
        }

        Set<String> expectedParams;
        String sensorTypeName;

        switch (sensorType) {
            case AIR:
                expectedParams = AIR_PARAMETERS;
                sensorTypeName = "AIR";
                break;
            case WATER:
                expectedParams = WATER_PARAMETERS;
                sensorTypeName = "WATER";
                break;
            case NOISE:
                expectedParams = NOISE_PARAMETERS;
                sensorTypeName = "NOISE";
                break;
            default:
                return "Unknown sensor type: " + sensorType;
        }

        boolean hasMatchingParameter = false;
        for (String header : headers) {
            String normalizedHeader = header.trim().toLowerCase().replace("_", "");
            for (String expectedParam : expectedParams) {
                if (expectedParam.toLowerCase().replace("_", "").equals(normalizedHeader)) {
                    hasMatchingParameter = true;
                    break;
                }
            }
            if (hasMatchingParameter) break;
        }

        if (!hasMatchingParameter) {
            return "CSV columns do not match " + sensorTypeName + " sensor type. Expected columns like: " +
                    getExpectedColumnsForType(sensorType) + ". CSV columns found: " + Arrays.toString(headers);
        }

        return null;
    }

    private String getExpectedColumnsForType(SensorType sensorType) {
        return switch (sensorType) {
            case AIR -> "PM2.5, PM10, CO2, NO2, SO2, O3";
            case WATER -> "pH, dissolvedOxygen, turbidity, conductivity, temperature, BOD";
            case NOISE -> "decibel, frequency, peak_level, ambient_level, frequency_range";
        };
    }
}

