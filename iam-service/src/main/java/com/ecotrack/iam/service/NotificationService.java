package com.ecotrack.iam.service;

import com.ecotrack.iam.dto.NotificationRequest;
import com.ecotrack.iam.dto.NotificationResponse;
import com.ecotrack.iam.entity.Notification;
import com.ecotrack.iam.enums.NotificationStatus;
import com.ecotrack.iam.exception.ResourceNotFoundException;
import com.ecotrack.iam.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .entityId(request.getEntityId())
                .message(request.getMessage())
                .category(request.getCategory())
                .status(NotificationStatus.UNREAD)
                .build();
        return toResponse(notificationRepository.save(notification));
    }

    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<NotificationResponse> getByUser(Long userId) {
        return notificationRepository.findByUserId(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    public List<NotificationResponse> getUnreadByUser(Long userId) {
        return notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public NotificationResponse markAsRead(Long id) {
        Notification n = findById(id);
        n.setStatus(NotificationStatus.READ);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public NotificationResponse markAsArchived(Long id) {
        Notification n = findById(id);
        n.setStatus(NotificationStatus.ARCHIVED);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void markAllReadForUser(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdAndStatus(userId, NotificationStatus.UNREAD);
        unread.forEach(n -> n.setStatus(NotificationStatus.READ));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResourceNotFoundException("Notification", id);
        }
        notificationRepository.deleteById(id);
    }

    private Notification findById(Long id) {
        return notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", id));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .notificationId(n.getNotificationId())
                .userId(n.getUserId())
                .entityId(n.getEntityId())
                .message(n.getMessage())
                .category(n.getCategory())
                .status(n.getStatus())
                .createdDate(n.getCreatedDate())
                .build();
    }
}

