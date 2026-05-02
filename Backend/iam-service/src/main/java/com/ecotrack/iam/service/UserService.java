package com.ecotrack.iam.service;

import com.ecotrack.iam.dto.ChangePasswordRequest;
import com.ecotrack.iam.dto.CreateUserRequest;
import com.ecotrack.iam.dto.UpdateUserRequest;
import com.ecotrack.iam.dto.UpdateProfileRequest;
import com.ecotrack.iam.dto.UserResponse;
import com.ecotrack.iam.entity.User;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.enums.UserStatus;
import com.ecotrack.iam.exception.BadRequestException;
import com.ecotrack.iam.exception.DuplicateResourceException;
import com.ecotrack.iam.exception.ResourceNotFoundException;
import com.ecotrack.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

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
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        return toResponse(userRepository.save(user));
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
     * - ADMINISTRATOR can create OFFICER, SCIENTIST, INDUSTRY, CITIZEN.
     */
    @Transactional
    public UserResponse createUser(CreateUserRequest request, UserRole callerRole) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        UserRole targetRole = request.getRole();

        // Enforce role hierarchy
        if (PRIVILEGED_ROLES.contains(targetRole) && callerRole != UserRole.SUPER_ADMIN) {
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

        return toResponse(userRepository.save(user));
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
    }

    /**
     * Update profile for the authenticated user (name, phone only).
     */
    @Transactional
    public UserResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhoneNumber() != null) user.setPhone(request.getPhoneNumber());
        // Email cannot be changed here
        return toResponse(userRepository.save(user));
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
