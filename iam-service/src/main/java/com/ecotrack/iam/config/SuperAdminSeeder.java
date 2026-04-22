package com.ecotrack.iam.config;

import com.ecotrack.iam.entity.User;
import com.ecotrack.iam.enums.UserRole;
import com.ecotrack.iam.enums.UserStatus;
import com.ecotrack.iam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds the initial SUPER_ADMIN user on first startup.
 * This ensures the system always has at least one privileged user
 * who can then provision ADMINISTRATOR and other roles.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SuperAdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        String superAdminEmail = "superadmin@ecotrack.com";
        if (userRepository.findByEmail(superAdminEmail).isEmpty()) {
            User superAdmin = User.builder()
                    .name("Super Admin")
                    .email(superAdminEmail)
                    .password(passwordEncoder.encode("SuperAdmin@123"))
                    .phone("0000000000")
                    .role(UserRole.SUPER_ADMIN)
                    .status(UserStatus.ACTIVE)
                    .build();
            userRepository.save(superAdmin);
            log.info("✅ Default SUPER_ADMIN user created — email: {}", superAdminEmail);
        } else {
            log.info("SUPER_ADMIN user already exists — skipping seed.");
        }
    }
}

