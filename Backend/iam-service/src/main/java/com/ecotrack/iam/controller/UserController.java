package com.ecotrack.iam.controller;

import com.ecotrack.iam.dto.ChangePasswordRequest;
import com.ecotrack.iam.dto.CreateUserRequest;
import com.ecotrack.iam.dto.UpdateUserRequest;
import com.ecotrack.iam.dto.UpdateProfileRequest;
import com.ecotrack.iam.response.ApiResponse;
import com.ecotrack.iam.dto.UserResponse;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


import java.util.List;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Admin user management APIs")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Create a user (SUPER_ADMIN / ADMINISTRATOR only)")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN','ROLE_ADMINISTRATOR')")
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request,
            @RequestHeader("X-User-Role") String callerRole) {
        UserRole role = UserRole.valueOf(callerRole);
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createUser(request, role));
    }

    @GetMapping
    @Operation(summary = "Get all users (SUPER_ADMIN / ADMINISTRATOR only)")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN','ROLE_ADMINISTRATOR')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @GetMapping("/role/{role}")
    @Operation(summary = "Get users by role")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN','ROLE_ADMINISTRATOR')")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable("role") UserRole role) {
        return ResponseEntity.ok(userService.getUsersByRole(role));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update user (self or admin)")
    public ResponseEntity<UserResponse> updateUser(@PathVariable("id") Long id,
                                                  @RequestBody UpdateUserRequest request) {
        // Get authenticated user's details
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String authEmail = authentication.getName();
        // You may want to fetch user by email to get their ID and role
        var userOpt = userService.findByEmail(authEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        var authUser = userOpt.get();
        boolean isAdmin = authUser.getRole() == UserRole.SUPER_ADMIN || authUser.getRole() == UserRole.ADMINISTRATOR;
        boolean isSelf = authUser.getUserId().equals(id);
        if (!isSelf && !isAdmin) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(userService.updateUser(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN','ROLE_ADMINISTRATOR')")
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/change-password")
    @Operation(summary = "Change password (any authenticated user)")
    public ResponseEntity<String> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        userService.changePassword(email, request);
        return ResponseEntity.ok("Password changed successfully");
    }

    @PutMapping("/update-profile")
    @Operation(summary = "Update own profile (name, phone only)")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        UserResponse updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }
}
