package com.tss.loan.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Temporary storage for pending registration data (in-memory only)
 * Stored for 5 minutes until email verification is complete
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingRegistration {
    private String email;
    private String phone;
    private String passwordHash;
    private String otpCode;
    private LocalDateTime expiresAt;
    private int attemptCount;
    
    /**
     * Check if this pending registration has expired
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    /**
     * Check if OTP code matches
     */
    public boolean verifyOtp(String code) {
        return this.otpCode.equals(code) && !isExpired() && attemptCount < 3;
    }
    
    /**
     * Increment verification attempt
     */
    public void incrementAttempt() {
        this.attemptCount++;
    }
}
