package com.ecotrack.monitoring.repository;

import com.ecotrack.monitoring.entity.SensorData;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SensorDataRepository extends JpaRepository<SensorData, Long> {
    List<SensorData> findBySensorId(Long sensorId);
}

