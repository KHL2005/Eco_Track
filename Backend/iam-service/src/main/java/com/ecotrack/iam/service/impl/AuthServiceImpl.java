package com.ecotrack.iam.service.impl;

import com.ecotrack.iam.client.NotificationClient;
import com.ecotrack.iam.dto.request.LoginRequest;
import com.ecotrack.iam.dto.request.NotificationRequest;
import com.ecotrack.iam.dto.request.RegisterRequest;
import com.ecotrack.iam.dto.response.AuthResponse;
import com.ecotrack.iam.entity.User;
import com.ecotrack.iam.enums.NotificationCategory;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.enums.UserStatus;
import com.ecotrack.iam.exception.BadRequestException;
import com.ecotrack.iam.exception.DuplicateResourceException;
import com.ecotrack.iam.repository.UserRepository;
import com.ecotrack.iam.security.JwtUtil;
import com.ecotrack.iam.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final NotificationClient notificationClient;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        if (request.getPhone() != null && !request.getPhone().isBlank()
                && userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicateResourceException("Phone number already registered: " + request.getPhone());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(UserRole.CITIZEN) // Public registration ALWAYS assigns CITIZEN
                .status(UserStatus.ACTIVE)
                .build();

        userRepository.save(user);
        notify(user.getUserId(), user.getUserId(),
                "Welcome to EcoTrack! Your account has been created successfully.", NotificationCategory.GENERAL);

        UserDetails userDetails = buildUserDetails(user);
        String token = jwtUtil.generateToken(userDetails, Map.of(
                "role", user.getRole().name(),
                "userId", user.getUserId()
        ));

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getUserId())
                .phone(user.getPhone())
                .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getStatus() == UserStatus.SUSPENDED || user.getStatus() == UserStatus.INACTIVE) {
            throw new BadRequestException("Account is " + user.getStatus().name().toLowerCase());
        }

        UserDetails userDetails = buildUserDetails(user);
        String token = jwtUtil.generateToken(userDetails, Map.of(
                "role", user.getRole().name(),
                "userId", user.getUserId()
        ));

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .role(user.getRole().name())
                .name(user.getName())
                .userId(user.getUserId())
                .phone(user.getPhone())
                .build();
    }

    private UserDetails buildUserDetails(User user) {
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
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
}
