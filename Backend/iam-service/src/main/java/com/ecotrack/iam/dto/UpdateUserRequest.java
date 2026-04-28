package com.ecotrack.iam.dto;

import com.ecotrack.iam.enums.UserStatus;
import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String phone;
    private UserStatus status;
}

