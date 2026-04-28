package com.ecotrack.citizen.feign;

import org.springframework.stereotype.Component;

@Component
public class IamServiceClientFallback implements IamServiceClient {

    @Override
    public UserDto getUserById(Long id) {
        // Return a fallback user when IAM service is unavailable
        return UserDto.builder()
                .userId(id)
                .name("Unknown")
                .role("CITIZEN")
                .status("ACTIVE")
                .build();
    }

    @Override
    public Boolean userExists(Long id) {
        return true; // Fail-open: assume user exists when IAM is down
    }
}
