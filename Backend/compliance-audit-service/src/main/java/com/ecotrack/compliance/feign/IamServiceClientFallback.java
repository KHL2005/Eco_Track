package com.ecotrack.compliance.feign;

import org.springframework.stereotype.Component;

@Component
public class IamServiceClientFallback implements IamServiceClient {

    @Override
    public UserDto getUserById(Long id) {
        return UserDto.builder()
                .userId(id)
                .name("Unknown Officer")
                .role("OFFICER")
                .status("ACTIVE")
                .build();
    }

    @Override
    public Boolean userExists(Long id) {
        return true; // Fail-open: assume officer exists when IAM is down
    }
}

