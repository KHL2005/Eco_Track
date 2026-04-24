package com.ecotrack.monitoring.repository;

import com.ecotrack.monitoring.entity.Sensor;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorRepository extends JpaRepository<Sensor, Long> {
}

