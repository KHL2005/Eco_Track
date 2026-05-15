package com.ecotrack.iam.service;

import com.ecotrack.iam.client.NotificationClient;
import com.ecotrack.iam.dto.ChangePasswordRequest;
import com.ecotrack.iam.dto.CreateUserRequest;
import com.ecotrack.iam.dto.NotificationRequest;
import com.ecotrack.iam.dto.UpdateUserRequest;
import com.ecotrack.iam.dto.UpdateProfileRequest;
import com.ecotrack.iam.dto.UserResponse;
import com.ecotrack.iam.entity.User;
import com.ecotrack.iam.enums.NotificationCategory;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.enums.UserStatus;
import com.ecotrack.iam.exception.BadRequestException;
import com.ecotrack.iam.exception.DuplicateResourceException;
import com.ecotrack.iam.exception.ResourceNotFoundException;
import com.ecotrack.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationClient notificationClient;

    private static final Set<UserRole> PRIVILEGED_ROLES = Set.of(UserRole.SUPER_ADMIN, UserRole.ADMINISTRATOR);

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return toResponse(user);
    }

    public List<UserResponse> getUsersByRole(UserRole role) {
        return userRepository.findByRole(role).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserResponse updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) {
            if (!request.getPhone().isBlank()
                    && userRepository.existsByPhoneAndUserIdNot(request.getPhone(), id)) {
                throw new DuplicateResourceException("Phone number already registered: " + request.getPhone());
            }
            user.setPhone(request.getPhone());
        }
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        User saved = userRepository.save(user);
        if (request.getStatus() != null) {
            notify(saved.getUserId(), saved.getUserId(),
                    "Your account status has been updated to " + request.getStatus() + ".",
                    NotificationCategory.GENERAL);
        }
        return toResponse(saved);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        userRepository.deleteById(id);
    }

    /**
     * Admin user creation with role hierarchy enforcement.
     * - Only SUPER_ADMIN can assign SUPER_ADMIN or ADMINISTRATOR roles.
     * - ADMINISTRATOR can create AGENCY_OFFICER, COMPLIANCE_OFFICER, SCIENTIST, INDUSTRY, CITIZEN.
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request, UserRole callerRole) {
        UserRole targetRole = request.getRole();
        log.info("createUser: email={}, targetRole={}, callerRole={}", request.getEmail(), targetRole, callerRole);

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already registered: " + request.getPhone());
        }

        // Enforce role hierarchy
        if (PRIVILEGED_ROLES.contains(targetRole) && callerRole != UserRole.SUPER_ADMIN) {
            log.warn("createUser: role hierarchy violation — caller={} attempted to assign targetRole={}", callerRole, targetRole);
            throw new BadRequestException("Only SUPER_ADMIN can assign ADMINISTRATOR or SUPER_ADMIN roles");
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(targetRole)
                .status(UserStatus.ACTIVE)
                .build();

        User created = userRepository.save(user);
        notify(created.getUserId(), created.getUserId(),
                "Your account has been created by an administrator. Role: " + targetRole + ".",
                NotificationCategory.GENERAL);
        return toResponse(created);
    }

    /**
     * Change password for any authenticated user.
     */
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        notify(user.getUserId(), user.getUserId(),
                "Your password has been changed successfully.", NotificationCategory.GENERAL);
    }

    /**
     * Update profile for the authenticated user (name, phone only).
     */
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhoneNumber() != null) {
            if (!request.getPhoneNumber().isBlank()
                    && userRepository.existsByPhoneAndUserIdNot(request.getPhoneNumber(), user.getUserId())) {
                throw new DuplicateResourceException("Phone number already registered: " + request.getPhoneNumber());
            }
            user.setPhone(request.getPhoneNumber());
        }
        // Email cannot be changed here
        return toResponse(userRepository.save(user));
    }

    private void notify(Long userId, Long entityId, String message, NotificationCategory category) {
        try {
            NotificationRequest req = new NotificationRequest();
            req.setUserId(userId);
            req.setEntityId(entityId);
            req.setMessage(message);
            req.setCategory(category);
            notificationClient.createNotification(req);
        } catch (Exception e) {
            log.warn("Failed to send notification to userId={}: {}", userId, e.getMessage());
        }
    }

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public java.util.Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
