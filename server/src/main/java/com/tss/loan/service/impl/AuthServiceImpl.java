package com.tss.loan.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.tss.loan.dto.request.ForgotPasswordRequest;
import com.tss.loan.dto.request.OtpVerificationRequest;
import com.tss.loan.dto.request.ResetPasswordRequest;
import com.tss.loan.dto.request.UserLoginRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.dto.response.ForgotPasswordResponse;
import com.tss.loan.dto.response.LoginResponse;
import com.tss.loan.dto.response.RegistrationResponse;
import com.tss.loan.dto.response.ResetPasswordResponse;
import com.tss.loan.dto.response.VerificationResponse;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.security.JwtTokenProvider;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.AuthService;
import com.tss.loan.service.EmailService;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.OtpService;
import com.tss.loan.service.UserService;
import com.tss.loan.service.UserDisplayService;
import com.tss.loan.service.OfficerProfileService;

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
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserDisplayService userDisplayService;
    
    @Autowired
    private OfficerProfileService officerProfileService;
    
    @Override
    public RegistrationResponse register(UserRegistrationRequest request) {
        // ✅ NEW APPROACH: Store registration data in-memory (NOT in database)
        // Validate that email/phone don't exist in database
        if (userService.existsByEmail(request.getEmail())) {
            throw new LoanApiException("An account with this email already exists. Please login instead.");
        }
        if (userService.existsByPhone(request.getPhone())) {
            throw new LoanApiException("An account with this phone number already exists. Please use a different number.");
        }
        
        // Encrypt password BEFORE storing in memory
        String passwordHash = passwordEncoder.encode(request.getPassword());
        
        // Generate and send OTP (stores data in-memory for 5 minutes)
        boolean otpSent = otpService.generateAndSendRegistrationOtp(
            request.getEmail(), 
            request.getPhone(), 
            passwordHash
        );
        
        if (!otpSent) {
            throw new LoanApiException("Failed to send verification email. Please try again.");
        }
        
        auditLogService.logAction(null, "REGISTRATION_INITIATED", "PendingRegistration", null, 
            "Registration initiated for email: " + request.getEmail() + ". Data stored in-memory for 5 minutes.");
        
        return RegistrationResponse.builder()
                .userId(null) // No user ID yet - user not created until verification
                .email(request.getEmail())
                .status("PENDING_VERIFICATION")
                .role("APPLICANT")
                .requiresEmailVerification(true)
                .requiresPhoneVerification(false)
                .message("📧 Registration initiated! Please check your email and verify within 5 minutes to complete registration.")
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
            
            // Generate JWT tokens (standard expiration: 24 hours access, 7 days refresh)
            String accessToken = jwtTokenProvider.generateToken(user);
            String refreshToken = jwtTokenProvider.generateRefreshToken(user);
            
            // Calculate expiration time directly instead of parsing the token
            // This avoids potential issues with token validation during login
            int expirationMs = 86400000; // 24 hours
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expirationMs / 1000);
            
            // Update last login
            user.setLastLoginAt(LocalDateTime.now());
            userService.updateUser(user);
            
            auditLogService.logAction(user, "LOGIN_SUCCESS", "User", null, 
                "User logged in successfully");
            
            // Get user's display name from personal details if available
            String displayName = getUserDisplayName(user);
            
            return LoginResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .type("Bearer")
                .expiresAt(expiresAt)
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(displayName)
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
            // ✅ NEW APPROACH: Check if this is a registration OTP or existing user OTP
            com.tss.loan.dto.request.PendingRegistration pendingReg = otpService.verifyRegistrationOtp(
                request.getEmail(), 
                request.getOtpCode()
            );
            
            if (pendingReg != null) {
                // This is a NEW REGISTRATION - Create user NOW after verification
                User user = new User();
                user.setEmail(pendingReg.getEmail());
                user.setPhone(pendingReg.getPhone());
                user.setPasswordHash(pendingReg.getPasswordHash()); // Already encrypted
                user.setRole(com.tss.loan.entity.enums.RoleType.APPLICANT);
                user.setStatus(com.tss.loan.entity.enums.UserStatus.ACTIVE); // Directly ACTIVE
                user.setIsEmailVerified(true); // Already verified
                user.setIsPhoneVerified(true);
                user.setFailedLoginAttempts(0);
                user.setCreatedAt(LocalDateTime.now());
                user.setUpdatedAt(LocalDateTime.now());
                
                // Save user to database
                user = userService.saveUserDirectly(user);
                
                // ✅ REMOVE from memory after successful user creation
                otpService.removePendingRegistration(request.getEmail());
                
                // Send welcome email
                emailService.sendWelcomeEmail(user.getEmail(), user.getEmail(), user);
                
                auditLogService.logAction(user, "USER_CREATED_AFTER_VERIFICATION", "User", null, 
                    "User created successfully after email verification: " + user.getEmail());
                
                return VerificationResponse.builder()
                    .message(String.format("🎉 Registration completed successfully! Welcome %s. Your account is now ACTIVE and you can login.", 
                        user.getEmail()))
                    .timestamp(LocalDateTime.now())
                    .success(true)
                    .userId(user.getId())
                    .email(user.getEmail())
                    .status(user.getStatus().toString())
                    .role(user.getRole().toString())
                    .requiresEmailVerification(false)
                    .requiresPhoneVerification(false)
                    .build();
            }
            
            // This is an EXISTING USER verifying email (old flow)
            User user = userService.findByEmail(request.getEmail());
            boolean isVerified = otpService.verifyEmailOtp(user, request.getOtpCode());
            
            if (!isVerified) {
                throw new LoanApiException("OTP verification failed");
            }
            
            user = userService.updateEmailVerificationStatus(user, true);
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
                .requiresEmailVerification(false)
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
    public LoginResponse refreshToken(String refreshToken) {
        try {
            // Validate refresh token
            if (!jwtTokenProvider.validateToken(refreshToken)) {
                throw new LoanApiException("Invalid or expired refresh token");
            }
            
            // Get user from refresh token
            String userEmail = jwtTokenProvider.getUserEmailFromToken(refreshToken);
            User user = userService.findByEmail(userEmail);
            
            // Validate user status
            validateUserForLogin(user);
            
            // Generate new tokens (standard expiration: 24 hours access, 7 days refresh)
            String newAccessToken = jwtTokenProvider.generateToken(user);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(user);
            
            // Calculate expiration
            int expirationMs = 86400000; // 24 hours
            LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(expirationMs / 1000);
            
            // Get display name
            String displayName = userDisplayService.getDisplayName(user);
            
            // Log token refresh
            auditLogService.logAction(user, "TOKEN_REFRESH", "User", null,
                "Access token refreshed successfully");
            
            return LoginResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .displayName(displayName)
                .role(user.getRole().name())
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .expiresAt(expiresAt)
                .message("Token refreshed successfully")
                .build();
                
        } catch (Exception e) {
            throw new LoanApiException("Token refresh failed: " + e.getMessage());
        }
    }
    
    @Override
    public void logout(String token) {
        try {
            // In a production system, you would add the token to a blacklist
            // For now, we'll just log the logout action without loading User entity
            if (jwtTokenProvider.validateToken(token)) {
                String userEmail = jwtTokenProvider.getUserEmailFromToken(token);
                
                // Log logout without loading User entity to avoid lazy loading queries
                auditLogService.logAction(null, "LOGOUT", "User", null, 
                    "User logged out successfully: " + userEmail);
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
            // Set account to locked status
            user.setStatus(com.tss.loan.entity.enums.UserStatus.LOCKED);
            
            // Audit log
            auditLogService.logAction(user, "ACCOUNT_LOCKED", "User", null, 
                "Account locked due to 5 failed login attempts");
            
            // Send notification to user
            try {
                notificationService.createNotification(
                    user,
                    NotificationType.IN_APP,
                    "Account Locked",
                    "Your account has been locked due to multiple failed login attempts. Please contact support to unlock your account."
                );
            } catch (Exception e) {
                // Log but don't fail
            }
            
            // Send email notification
            try {
                emailService.sendLoanStatusEmail(
                    user.getEmail(),
                    "ACCOUNT_LOCKED",
                    user.getId().toString(),
                    user
                );
            } catch (Exception e) {
                // Log but don't fail
            }
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
    
    @Override
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        try {
            // Find user by email
            User user = userService.findByEmail(request.getEmail());
            
            // Check if account is active
            if (user.getStatus().toString().equals("BLOCKED") || user.getStatus().toString().equals("SUSPENDED")) {
                throw new LoanApiException("Your account is " + user.getStatus().toString().toLowerCase() + ". Please contact support.");
            }
            
            // Generate and send password reset OTP
            boolean otpSent = otpService.generateAndSendPasswordResetOtp(user);
            
            if (!otpSent) {
                throw new LoanApiException("Failed to send password reset email. Please try again.");
            }
            
            auditLogService.logAction(user, "PASSWORD_RESET_REQUESTED", "User", null, 
                "Password reset OTP sent to email");
            
            return ForgotPasswordResponse.builder()
                    .message("Password reset OTP has been sent to your email address. Please check your inbox.")
                    .email(request.getEmail())
                    .otpExpiryMinutes(15)
                    .timestamp(LocalDateTime.now())
                    .build();
                    
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(null, "PASSWORD_RESET_ERROR", "User", null, 
                "Password reset error for email: " + request.getEmail());
            throw new LoanApiException("Failed to process password reset request: " + e.getMessage());
        }
    }
    
    @Override
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        try {
            // Validate password confirmation
            if (!request.getNewPassword().equals(request.getConfirmPassword())) {
                throw new LoanApiException("Passwords do not match");
            }
            
            // Find user by email
            User user = userService.findByEmail(request.getEmail());
            
            // Verify OTP
            boolean otpValid = otpService.verifyPasswordResetOtp(user, request.getOtpCode());
            
            if (!otpValid) {
                auditLogService.logAction(user, "PASSWORD_RESET_FAILED", "User", null, 
                    "Invalid or expired OTP");
                throw new LoanApiException("Invalid or expired OTP. Please request a new password reset.");
            }
            
            // Update password
            String newPasswordHash = passwordEncoder.encode(request.getNewPassword());
            user.setPasswordHash(newPasswordHash);
            user.setUpdatedAt(LocalDateTime.now());
            
            // Reset failed login attempts
            user.setFailedLoginAttempts(0);
            
            userService.updateUser(user);
            
            auditLogService.logAction(user, "PASSWORD_RESET_SUCCESS", "User", null, 
                "Password successfully reset");
            
            // Send success email notification
            emailService.sendPasswordResetSuccessEmail(user.getEmail(), user);
            
            return ResetPasswordResponse.builder()
                    .message("Your password has been successfully reset. You can now login with your new password.")
                    .email(request.getEmail())
                    .success(true)
                    .timestamp(LocalDateTime.now())
                    .build();
                    
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(null, "PASSWORD_RESET_ERROR", "User", null, 
                "Password reset error for email: " + request.getEmail());
            throw new LoanApiException("Failed to reset password: " + e.getMessage());
        }
    }
    
    /**
     * Get user's display name using appropriate service based on role
     * Returns full name if available, otherwise email username
     */
    private String getUserDisplayName(User user) {
        try {
            // For applicants, use UserDisplayService
            if ("APPLICANT".equals(user.getRole().toString())) {
                return userDisplayService.getDisplayName(user);
            }
            // For officers, use OfficerProfileService
            else if ("LOAN_OFFICER".equals(user.getRole().toString()) || 
                     "COMPLIANCE_OFFICER".equals(user.getRole().toString()) ||
                     "ADMIN".equals(user.getRole().toString())) {
                return officerProfileService.getOfficerDisplayName(user);
            }
        } catch (Exception e) {
            // If any error, fall back to email username
            System.err.println("Error fetching display name: " + e.getMessage());
        }
        
        // Fallback to email username
        return user.getEmail().split("@")[0];
    }
}
