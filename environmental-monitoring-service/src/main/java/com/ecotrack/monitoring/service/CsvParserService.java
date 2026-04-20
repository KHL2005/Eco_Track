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

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvParserService {

    private final MonitoringService monitoringService;

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
}

