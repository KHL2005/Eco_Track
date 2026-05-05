package com.ecotrack.project.feign;

import org.springframework.stereotype.Component;

@Component
public class IamServiceClientFallback implements IamServiceClient {

    @Override
    public UserDto getUserById(Long id) {
        return UserDto.builder()
                .userId(id)
                .name("Unknown User")
                .role("AGENCY_OFFICER")
                .status("ACTIVE")
                .build();
    }

    @Override
    public Boolean userExists(Long id) {
        return true; // Fail-open: assume user exists when IAM is down
    }
}

