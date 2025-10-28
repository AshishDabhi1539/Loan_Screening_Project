package com.tss.loan.config;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.UserRepository;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class AdminInitializationConfig implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Value("${app.admin.email}")
    private String adminEmail;
    
    @Value("${app.admin.password}")
    private String adminPassword;
    
    @Value("${app.admin.phone}")
    private String adminPhone;

    @Override
    public void run(String... args) throws Exception {
        initializeAdminUser();
    }
    
    private void initializeAdminUser() {
        try {
            // Check if admin already exists
            if (userRepository.findByEmail(adminEmail).isPresent()) {
                log.info("✅ Admin user already exists with email: {}", adminEmail);
                return;
            }
            
            // Create admin user
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setPhone(adminPhone);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setRole(RoleType.ADMIN);
            admin.setStatus(UserStatus.ACTIVE);
            admin.setIsEmailVerified(true);
            admin.setIsPhoneVerified(true);
            admin.setFailedLoginAttempts(0);
            admin.setCreatedAt(LocalDateTime.now());
            admin.setUpdatedAt(LocalDateTime.now());
            
            userRepository.save(admin);
            
            log.info("=".repeat(60));
            log.info("🎉 ADMIN USER INITIALIZED SUCCESSFULLY");
            log.info("📧 Email: {}", adminEmail);
            log.info("🔑 Password: {}", adminPassword);
            log.info("📱 Phone: {}", adminPhone);
            log.info("👤 Role: ADMIN");
            log.info("✅ Status: ACTIVE");
            log.info("=".repeat(60));
            log.warn("⚠️  IMPORTANT: Change the default admin password in production!");
            log.info("=".repeat(60));
            
        } catch (Exception e) {
            log.error("❌ Failed to initialize admin user: {}", e.getMessage());
            e.printStackTrace();
        }
    }
}
