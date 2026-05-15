package com.ecotrack.iam.controller;

import com.ecotrack.iam.dto.UserResponse;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Internal controller for service-to-service communication only.
 * These endpoints bypass JWT auth and are for Feign clients within the cluster.
 */
@RestController
@RequestMapping("/api/v1/internal")
@RequiredArgsConstructor
@Tag(name = "Internal APIs", description = "Service-to-service internal endpoints (no auth required)")
public class InternalUserController {

    private final UserService userService;

    @GetMapping("/users/{id}")
    @Operation(summary = "Get user by ID (internal - no auth)")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/users/{id}/exists")
    @Operation(summary = "Check if user exists (internal - no auth)")
    public ResponseEntity<Boolean> userExists(@PathVariable Long id) {
        try {
            userService.getUserById(id);
            return ResponseEntity.ok(true);
        } catch (Exception e) {
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/users/role/{role}")
    @Operation(summary = "Get users by role (internal - no auth)")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable("role") String role) {
        UserRole userRole = UserRole.valueOf(role.toUpperCase());
        return ResponseEntity.ok(userService.getUsersByRole(userRole));
    }
}

