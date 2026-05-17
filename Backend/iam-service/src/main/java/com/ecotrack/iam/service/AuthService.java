package com.ecotrack.iam.service;

import com.ecotrack.iam.dto.request.LoginRequest;
import com.ecotrack.iam.dto.request.RegisterRequest;
import com.ecotrack.iam.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
}
