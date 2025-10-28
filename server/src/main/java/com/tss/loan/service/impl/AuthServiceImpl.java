package com.tss.loan.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.loan.dto.request.OtpVerificationRequest;
import com.tss.loan.dto.request.UserLoginRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.dto.response.LoginResponse;
import com.tss.loan.dto.response.RegistrationResponse;
import com.tss.loan.dto.response.VerificationResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.security.JwtTokenProvider;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.AuthService;
import com.tss.loan.service.EmailService;
import com.tss.loan.service.OtpService;
import com.tss.loan.service.UserService;

@Service
public class AuthServiceImpl implements AuthService {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private OtpService otpService;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    public RegistrationResponse register(UserRegistrationRequest request) {
        // Create user (validation happens in UserService)
        User user = userService.createUser(request);
        
        // Generate and send OTP for email verification
        boolean otpSent = otpService.generateAndSendEmailOtp(user);
        
        if (!otpSent) {
            throw new LoanApiException("Registration successful but failed to send verification email. Please try resending OTP.");
        }
        
        auditLogService.logAction(user, "USER_REGISTRATION_COMPLETED", "User", null, 
        "User registration completed, OTP sent for verification");
        
        return RegistrationResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .status(user.getStatus().toString())
                .role(user.getRole().toString())
                .requiresEmailVerification(true)
                .requiresPhoneVerification(false)
                .message("📧 Registration successful! Your account is PENDING_VERIFICATION. Please check your email and verify to activate your account.")
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    @Override
    public LoginResponse login(UserLoginRequest request) {
        try {
            // Find user by email or phone
            User user = userService.findByEmailOrPhone(request.getEmailOrPhone());
            
            // Validate account status and login attempts
            validateUserForLogin(user);
            
            // Verify password
            if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
                handleFailedLogin(user);
                throw new LoanApiException("Invalid credentials");
            }
            
            // Check if email verification is required
            if (!user.getIsEmailVerified()) {
                auditLogService.logAction(user, "LOGIN_BLOCKED_UNVERIFIED", "User", null, 
                    "Login blocked - email not verified");
                throw new LoanApiException("Please verify your email before logging in");
            }
            
            // Reset failed login attempts on successful login
            resetFailedLoginAttempts(user);
            
            // Generate JWT tokens
            String accessToken = jwtTokenProvider.generateToken(user);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user);
            LocalDateTime expiresAt = jwtTokenProvider.getExpirationDateFromToken(accessToken);
            
            // Update last login
            user.setLastLoginAt(LocalDateTime.now());
            userService.updateUser(user);
            
            auditLogService.logAction(user, "LOGIN_SUCCESS", "User", null, 
                "User logged in successfully");
            
            return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .type("Bearer")
                .expiresAt(expiresAt)
                .userId(user.getId())
                .email(user.getEmail())
                .role(user.getRole().toString())
                .message("Login successful")
                .build();
                
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(null, "LOGIN_ERROR", "User", null, 
                "Login error: " + e.getMessage());
            throw new LoanApiException("Login failed: " + e.getMessage());
        }
    }
    
    @Override
    public VerificationResponse verifyEmailOtp(OtpVerificationRequest request) {
        try {
            // Find user
            User user = userService.findByEmail(request.getEmail());
            
            // Verify OTP
            boolean isVerified = otpService.verifyEmailOtp(user, request.getOtpCode());
            
            if (!isVerified) {
                throw new LoanApiException("OTP verification failed");
            }
            
            // Update user email verification status
            user = userService.updateEmailVerificationStatus(user, true);
            
            // Send welcome email
            emailService.sendWelcomeEmail(user.getEmail(), user.getEmail(), user);
            
            auditLogService.logAction(user, "EMAIL_VERIFIED_SUCCESS", "User", null, 
                "Email verification completed successfully");
            
            return VerificationResponse.builder()
                .message(String.format("🎉 Account activated successfully! Welcome %s. Your account is now ACTIVE and you can login with your credentials.", 
                    user.getEmail()))
                .timestamp(LocalDateTime.now())
                .success(true)
                .userId(user.getId())
                .email(user.getEmail())
                .status(user.getStatus().toString())
                .role(user.getRole().toString())
                .requiresEmailVerification(false) // Now verified
                .requiresPhoneVerification(false)
                .build();
                
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(null, "OTP_VERIFICATION_ERROR", "OtpVerification", null, 
                "OTP verification error: " + e.getMessage());
            throw new LoanApiException("OTP verification failed: " + e.getMessage());
        }
    }
    
    @Override
    public boolean resendEmailOtp(String email) {
        try {
            User user = userService.findByEmail(email);
            
            if (user.getIsEmailVerified()) {
                throw new LoanApiException("Email is already verified");
            }
            
            boolean otpSent = otpService.generateAndSendEmailOtp(user);
            
            if (otpSent) {
                auditLogService.logAction(user, "OTP_RESENT", "OtpVerification", null, 
                    "Email OTP resent successfully");
            }
            
            return otpSent;
            
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(null, "OTP_RESEND_ERROR", "OtpVerification", null, 
                "OTP resend error: " + e.getMessage());
            throw new LoanApiException("Failed to resend OTP: " + e.getMessage());
        }
    }
    
    @Override
    public void logout(String token) {
        try {
            // In a production system, you would add the token to a blacklist
            // For now, we'll just log the logout action
            if (jwtTokenProvider.validateToken(token)) {
                String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
                User user = userService.findByEmail(userEmail);
                
                auditLogService.logAction(user, "LOGOUT", "User", null, 
                    "User logged out successfully");
            }
        } catch (Exception e) {
            // Silent fail for logout - log at debug level
            // Could add logger if needed: log.debug("Logout error: {}", e.getMessage());
        }
    }
    
    // Private helper methods
    
    private void validateUserForLogin(User user) {
        switch (user.getStatus()) {
            case PENDING_VERIFICATION:
                throw new LoanApiException("Account is pending email verification. Please verify your email first.");
            case INACTIVE:
                throw new LoanApiException("Account is inactive. Please contact support.");
            case SUSPENDED:
                throw new LoanApiException("Account is suspended. Please contact support.");
            case BLOCKED:
                throw new LoanApiException("Account is blocked due to security reasons. Please contact support.");
            case LOCKED:
                throw new LoanApiException("Account is temporarily locked. Please try again later or contact support.");
            default:
                break;
        }
        
        if (user.getFailedLoginAttempts() >= 5) {
            throw new LoanApiException("Account is temporarily locked due to too many failed login attempts. Please try again after 1 hour or contact support.");
        }
    }
    
    private void handleFailedLogin(User user) {
        user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
        user.setUpdatedAt(LocalDateTime.now());
        
        // Lock account after 5 failed attempts
        if (user.getFailedLoginAttempts() >= 5) {
            // In production, you might want to set a lock timestamp
            auditLogService.logAction(user, "ACCOUNT_LOCKED", "User", null, 
                "Account locked due to 5 failed login attempts");
        }
        
        // Update user
        userService.updateUser(user);
        
        auditLogService.logAction(user, "LOGIN_FAILED", "User", null, 
            "Failed login attempt #" + user.getFailedLoginAttempts());
    }
    
    private void resetFailedLoginAttempts(User user) {
        if (user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setUpdatedAt(LocalDateTime.now());
            userService.updateUser(user);
        }
    }
}
