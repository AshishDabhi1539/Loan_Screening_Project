package com.tss.loan.controller.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tss.loan.dto.request.ForgotPasswordRequest;
import com.tss.loan.dto.request.OtpResendRequest;
import com.tss.loan.dto.request.OtpVerificationRequest;
import com.tss.loan.dto.request.RefreshTokenRequest;
import com.tss.loan.dto.request.ResetPasswordRequest;
import com.tss.loan.dto.request.UserLoginRequest;
import com.tss.loan.dto.request.UserRegistrationRequest;
import com.tss.loan.dto.response.ForgotPasswordResponse;
import com.tss.loan.dto.response.LoginResponse;
import com.tss.loan.dto.response.RegistrationResponse;
import com.tss.loan.dto.response.ResetPasswordResponse;
import com.tss.loan.dto.response.VerificationResponse;
import com.tss.loan.service.AuthService;

import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/auth")
@Slf4j
public class AuthController {
    
    @Autowired
    private AuthService authService;
    
    /**
     * User Registration
     */
    @PostMapping("/register")
    public ResponseEntity<RegistrationResponse> register(@Valid @RequestBody UserRegistrationRequest request) {
        log.info("Registration request received for email: {}", request.getEmail());
        
        RegistrationResponse response = authService.register(request);
        
        log.info("Registration successful for email: {}", request.getEmail());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    /**
     * User Login
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody UserLoginRequest request) {
        log.info("Login request received for email/phone: {}", request.getEmailOrPhone());
        
        LoginResponse response = authService.login(request);
        
        log.info("Login successful for: {}", request.getEmailOrPhone());
        return ResponseEntity.ok(response);
    }
    
    /**
     * Email OTP Verification
     */
    @PostMapping("/verify-email")
    public ResponseEntity<VerificationResponse> verifyEmail(@Valid @RequestBody OtpVerificationRequest request) {
        log.info("Email verification request received for: {}", request.getEmail());
        
        VerificationResponse response = authService.verifyEmailOtp(request);
        
        log.info("Email verification successful for: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }
    
    /**
     * Resend Email OTP
     */
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@Valid @RequestBody OtpResendRequest request) {
        log.info("Resend OTP request received for: {}", request.getEmail());
        
        try {
            boolean sent = authService.resendEmailOtp(request.getEmail());
            
            if (sent) {
                log.info("OTP resent successfully for: {}", request.getEmail());
                return ResponseEntity.ok("OTP sent successfully to your email address");
            } else {
                log.error("Failed to resend OTP for: {}", request.getEmail());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send OTP. Please try again.");
            }
        } catch (Exception e) {
            log.error("Error resending OTP for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(e.getMessage());
        }
    }
    
    /**
     * Refresh Token
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Refresh token request received");
        
        LoginResponse response = authService.refreshToken(request.getRefreshToken());
        
        log.info("Token refreshed successfully");
        return ResponseEntity.ok(response);
    }
    
    /**
     * User Logout
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Logout request received");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            authService.logout(token);
        }
        
        log.info("Logout successful");
        return ResponseEntity.ok("Logged out successfully");
    }
    
    /**
     * Forgot Password - Send OTP
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<ForgotPasswordResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Forgot password request received for email: {}", request.getEmail());
        
        ForgotPasswordResponse response = authService.forgotPassword(request);
        
        log.info("Password reset OTP sent successfully to: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }
    
    /**
     * Reset Password - Verify OTP and Update Password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ResetPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        log.info("Reset password request received for email: {}", request.getEmail());
        
        ResetPasswordResponse response = authService.resetPassword(request);
        
        log.info("Password reset successful for: {}", request.getEmail());
        return ResponseEntity.ok(response);
    }
}
