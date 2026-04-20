package com.ecotrack.monitoring.feign;

import org.springframework.stereotype.Component;

@Component
public class IamServiceClientFallback implements IamServiceClient {

    @Override
    public UserDto getUserById(Long id) {
        return UserDto.builder()
                .userId(id)
                .name("Unknown Scientist")
                .role("SCIENTIST")
                .status("ACTIVE")
                .build();
    }

    @Override
    public Boolean userExists(Long id) {
        return true; // Fail-open: assume scientist exists when IAM is down
    }
}
