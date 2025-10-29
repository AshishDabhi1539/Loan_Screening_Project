package com.tss.loan.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.tss.loan.dto.PendingRegistration;
import com.tss.loan.entity.security.OtpVerification;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.OtpVerificationRepository;

@Service
public class OtpService {
    
    // IN-MEMORY STORAGE for pending registrations (5 minute expiry)
    private final Map<String, PendingRegistration> pendingRegistrations = new ConcurrentHashMap<>();
    
    @Autowired
    private OtpVerificationRepository otpRepository;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    private final SecureRandom random = new SecureRandom();
    
    /**
     * Generate and send EMAIL verification OTP
     * SECURITY: Automatically invalidates all previous email OTPs
     */
    public boolean generateAndSendEmailOtp(User user) {
        return generateAndSendOtp(user, "EMAIL_VERIFICATION", user.getEmail(), 10);
    }
    
    /**
     * Generate and send OTP for NEW REGISTRATION (stores data in-memory for 5 minutes)
     * Does NOT create user in database until verification is complete
     */
    public boolean generateAndSendRegistrationOtp(String email, String phone, String passwordHash) {
        try {
            // Check if email already has active pending registration
            PendingRegistration existing = pendingRegistrations.get(email);
            if (existing != null && !existing.isExpired()) {
                // Invalidate old one and create new
                auditLogService.logAction(null, "PREVIOUS_PENDING_REGISTRATION_INVALIDATED", "PendingRegistration", null, 
                    "Invalidated previous pending registration for email: " + email);
            }
            
            // Generate 6-digit OTP
            String otpCode = String.format("%06d", random.nextInt(1000000));
            
            // Create pending registration (in-memory, NOT in database)
            PendingRegistration pendingReg = PendingRegistration.builder()
                .email(email)
                .phone(phone)
                .passwordHash(passwordHash)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(5)) // 5 minutes as requested
                .attemptCount(0)
                .build();
            
            // Store in memory
            pendingRegistrations.put(email, pendingReg);
            
            // Send OTP email
            boolean sent = emailService.sendOtpEmail(email, otpCode, null);
            
            if (sent) {
                auditLogService.logAction(null, "REGISTRATION_OTP_SENT", "PendingRegistration", null, 
                    "Registration OTP sent to " + email + ". Data stored in-memory for 5 minutes.");
                return true;
            } else {
                // Remove from memory if email fails
                pendingRegistrations.remove(email);
                throw new LoanApiException("Failed to send registration OTP. Please try again.");
            }
            
        } catch (Exception e) {
            auditLogService.logAction(null, "REGISTRATION_OTP_FAILED", "PendingRegistration", null, 
                "Failed to generate registration OTP: " + e.getMessage());
            throw new LoanApiException("Failed to send registration OTP: " + e.getMessage());
        }
    }
    
    /**
     * Verify registration OTP and return registration data
     * Returns pending registration if OTP is valid, null otherwise
     */
    public PendingRegistration verifyRegistrationOtp(String email, String otpCode) {
        try {
            // Get pending registration from memory
            PendingRegistration pendingReg = pendingRegistrations.get(email);
            
            if (pendingReg == null) {
                throw new LoanApiException("No pending registration found for this email. Please register again.");
            }
            
            // Check if expired
            if (pendingReg.isExpired()) {
                pendingRegistrations.remove(email);
                throw new LoanApiException("Registration OTP has expired. Please register again.");
            }
            
            // Check attempts
            if (pendingReg.getAttemptCount() >= 3) {
                pendingRegistrations.remove(email);
                throw new LoanApiException("Maximum OTP attempts exceeded. Please register again.");
            }
            
            // Verify OTP
            if (pendingReg.verifyOtp(otpCode)) {
                auditLogService.logAction(null, "REGISTRATION_OTP_VERIFIED", "PendingRegistration", null, 
                    "Registration OTP verified successfully for: " + email);
                return pendingReg; // Return data so AuthService can create user
            } else {
                pendingReg.incrementAttempt();
                auditLogService.logAction(null, "REGISTRATION_OTP_VERIFICATION_FAILED", "PendingRegistration", null, 
                    "Invalid OTP attempt for: " + email + ". Attempts: " + pendingReg.getAttemptCount());
                throw new LoanApiException("Invalid OTP code. Attempts remaining: " + (3 - pendingReg.getAttemptCount()));
            }
            
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            throw new LoanApiException("OTP verification failed: " + e.getMessage());
        }
    }
    
    /**
     * Remove pending registration from memory after successful user creation
     */
    public void removePendingRegistration(String email) {
        PendingRegistration removed = pendingRegistrations.remove(email);
        if (removed != null) {
            auditLogService.logAction(null, "PENDING_REGISTRATION_REMOVED", "PendingRegistration", null, 
                "Removed pending registration from memory for: " + email);
        }
    }
    
    /**
     * Check if email has active pending registration
     */
    public boolean hasPendingRegistration(String email) {
        PendingRegistration pendingReg = pendingRegistrations.get(email);
        return pendingReg != null && !pendingReg.isExpired();
    }
    
    /**
     * Verify EMAIL OTP
     * SECURITY: Enhanced verification with type checking
     */
    public boolean verifyEmailOtp(User user, String otpCode) {
        return verifyOtp(user, otpCode, "EMAIL_VERIFICATION");
    }
    
    /**
     * Generate and send LOGIN 2FA OTP
     * SECURITY: Automatically invalidates all previous 2FA OTPs
     */
    public boolean generateAndSendLogin2FA(User user) {
        return generateAndSendOtp(user, "LOGIN_2FA", user.getEmail(), 5); // 5 minutes for 2FA
    }
    
    /**
     * Generate and send PASSWORD RESET OTP
     * SECURITY: Automatically invalidates all previous password reset OTPs
     */
    public boolean generateAndSendPasswordResetOtp(User user) {
        return generateAndSendOtp(user, "PASSWORD_RESET", user.getEmail(), 15); // 15 minutes for password reset
    }
    
    /**
     * Verify LOGIN 2FA OTP
     */
    public boolean verifyLogin2FA(User user, String otpCode) {
        return verifyOtp(user, otpCode, "LOGIN_2FA");
    }
    
    /**
     * Verify PASSWORD RESET OTP
     */
    public boolean verifyPasswordResetOtp(User user, String otpCode) {
        return verifyOtp(user, otpCode, "PASSWORD_RESET");
    }
    
    /**
     * Generate OTP for any type (EMAIL_VERIFICATION, LOGIN_2FA, PASSWORD_RESET, etc.)
     * SECURITY: Automatically invalidates all previous OTPs of the same type
     */
    public boolean generateAndSendOtp(User user, String otpType, String sentTo, int expiryMinutes) {
        try {
            // Check rate limiting - max 3 attempts per hour for any OTP type
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long recentAttempts = otpRepository.countRecentAttempts(user, otpType, oneHourAgo);
            
            if (recentAttempts >= 3) {
                throw new LoanApiException("Too many OTP requests for " + otpType + ". Please try again after 1 hour.");
            }
            
            // SECURITY FIX: Invalidate all previous OTPs for this user and type
            int invalidatedCount = otpRepository.invalidatePreviousOtps(user, otpType);
            if (invalidatedCount > 0) {
                auditLogService.logAction(user, "PREVIOUS_OTPS_INVALIDATED", "OtpVerification", null, 
                    "Invalidated " + invalidatedCount + " previous " + otpType + " OTPs before generating new one");
            }
            
            // Generate 6-digit OTP
            String otpCode = String.format("%06d", random.nextInt(1000000));
            
            // Create OTP record
            OtpVerification otp = new OtpVerification();
            otp.setUser(user);
            otp.setOtpCode(otpCode);
            otp.setOtpType(otpType);
            otp.setSentTo(sentTo);
            otp.setExpiresAt(LocalDateTime.now().plusMinutes(expiryMinutes));
            otp.setIsVerified(false);
            otp.setIsExpired(false);
            otp.setAttemptCount(0);
            otp.setMaxAttempts(3);
            
            otpRepository.save(otp);
            
            // Send email (only for email-based OTPs)
            boolean sent = false;
            if (otpType.contains("EMAIL") || sentTo.contains("@")) {
                sent = emailService.sendOtpEmail(sentTo, otpCode, user);
            } else {
                // For SMS or other types, implement accordingly
                sent = true; // Placeholder
            }
            
            if (sent) {
                auditLogService.logAction(user, "OTP_GENERATED", "OtpVerification", otp.getId(), 
                    otpType + " OTP generated and sent to " + sentTo);
                return true;
            } else {
                throw new LoanApiException("Failed to send " + otpType + " OTP. Please try again.");
            }
            
        } catch (Exception e) {
            auditLogService.logAction(user, "OTP_GENERATION_FAILED", "OtpVerification", null, 
                "Failed to generate " + otpType + " OTP: " + e.getMessage());
            throw new LoanApiException("Failed to generate OTP: " + e.getMessage());
        }
    }
    
    /**
     * Enhanced OTP verification with additional security checks
     * SECURITY: Invalidates OTP after successful verification
     */
    public boolean verifyOtp(User user, String otpCode, String otpType) {
        try {
            // Find active OTP
            Optional<OtpVerification> otpOpt = otpRepository.findValidOtpByUserAndCode(
                user, otpCode, LocalDateTime.now()
            );
            
            if (!otpOpt.isPresent()) {
                auditLogService.logAction(user, "OTP_VERIFICATION_FAILED", "OtpVerification", null, 
                    "Invalid or expired " + otpType + " OTP code");
                throw new LoanApiException("Invalid or expired OTP code");
            }
            
            OtpVerification otp = otpOpt.get();
            
            // Verify OTP type matches
            if (!otp.getOtpType().equals(otpType)) {
                auditLogService.logAction(user, "OTP_TYPE_MISMATCH", "OtpVerification", otp.getId(), 
                    "OTP type mismatch: expected " + otpType + ", found " + otp.getOtpType());
                throw new LoanApiException("Invalid OTP type");
            }
            
            // Check if already verified
            if (otp.getIsVerified()) {
                throw new LoanApiException("OTP already verified");
            }
            
            // Check attempts
            if (otp.getAttemptCount() >= otp.getMaxAttempts()) {
                otp.setIsExpired(true);
                otpRepository.save(otp);
                throw new LoanApiException("Maximum OTP attempts exceeded");
            }
            
            // Verify OTP
            if (otp.getOtpCode().equals(otpCode)) {
                otp.markAsVerified();
                otpRepository.save(otp);
                
                // SECURITY: Invalidate any other pending OTPs of the same type after successful verification
                otpRepository.invalidatePreviousOtps(user, otpType);
                
                auditLogService.logAction(user, "OTP_VERIFIED", "OtpVerification", otp.getId(), 
                    otpType + " OTP verified successfully");
                return true;
            } else {
                otp.incrementAttempt();
                otpRepository.save(otp);
                
                auditLogService.logAction(user, "OTP_VERIFICATION_FAILED", "OtpVerification", otp.getId(), 
                    "Invalid " + otpType + " OTP code attempt");
                throw new LoanApiException("Invalid OTP code");
            }
            
        } catch (LoanApiException e) {
            throw e;
        } catch (Exception e) {
            auditLogService.logAction(user, "OTP_VERIFICATION_ERROR", "OtpVerification", null, 
                otpType + " OTP verification error: " + e.getMessage());
            throw new LoanApiException("OTP verification failed: " + e.getMessage());
        }
    }

    /**
     * Cleanup expired OTPs and pending registrations
     * Runs every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void cleanupExpiredOtps() {
        try {
            // Cleanup database OTPs
            otpRepository.expireOldOtps(LocalDateTime.now());
            
            // Delete old verified OTPs (older than 24 hours)
            LocalDateTime cutoffDate = LocalDateTime.now().minusHours(24);
            otpRepository.deleteOldVerifiedOtps(cutoffDate);
            
            // Cleanup expired pending registrations from memory
            int removedCount = 0;
            for (Map.Entry<String, PendingRegistration> entry : pendingRegistrations.entrySet()) {
                if (entry.getValue().isExpired()) {
                    pendingRegistrations.remove(entry.getKey());
                    removedCount++;
                }
            }
            
            if (removedCount > 0) {
                auditLogService.logAction(null, "PENDING_REGISTRATIONS_CLEANUP", "PendingRegistration", null, 
                    "Removed " + removedCount + " expired pending registrations from memory");
            }
            
        } catch (Exception e) {
            // Silent fail for cleanup - could add debug logging if needed
        }
    }
}
