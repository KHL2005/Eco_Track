package com.ecotrack.iam.service;

import com.ecotrack.iam.dto.request.ChangePasswordRequest;
import com.ecotrack.iam.dto.request.CreateUserRequest;
import com.ecotrack.iam.dto.request.UpdateProfileRequest;
import com.ecotrack.iam.dto.request.UpdateUserRequest;
import com.ecotrack.iam.dto.response.UserResponse;
import com.ecotrack.iam.entity.User;
import com.ecotrack.iam.enums.UserRole;

import java.util.List;
import java.util.Optional;

public interface UserService {
    List<UserResponse> getAllUsers();
    UserResponse getUserById(Long id);
    List<UserResponse> getUsersByRole(UserRole role);
    UserResponse createUser(CreateUserRequest request, UserRole callerRole);
    UserResponse updateUser(Long id, UpdateUserRequest request);
    void deleteUser(Long id);
    void changePassword(String email, ChangePasswordRequest request);
    UserResponse updateProfile(String email, UpdateProfileRequest request);
    Optional<User> findByEmail(String email);
}
