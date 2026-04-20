package com.ecotrack.monitoring.repository;

import com.ecotrack.monitoring.entity.Sensor;
import com.ecotrack.monitoring.enums.SensorType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
    List<Sensor> findByType(SensorType type);
}

