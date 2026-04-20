package com.ecotrack.iam.repository;

import com.ecotrack.iam.entity.Notification;
import com.ecotrack.iam.enums.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
    List<Notification> findByUserIdAndStatus(Long userId, NotificationStatus status);
}

