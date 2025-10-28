package com.tss.loan.entity.security;

import java.time.LocalDateTime;

import com.tss.loan.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "otp_verifications", indexes = {
        @Index(name = "idx_otp_user", columnList = "user_id"),
        @Index(name = "idx_otp_type", columnList = "otpType"),
        @Index(name = "idx_otp_status", columnList = "isVerified,isExpired"),
        @Index(name = "idx_otp_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class OtpVerification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @Column(nullable = false, length = 10)
    private String otpCode;
    
    @Column(nullable = false, length = 50)
    private String otpType; // EMAIL_VERIFICATION, LOGIN_2FA, PASSWORD_RESET
    
    @Column(nullable = false, length = 150)
    private String sentTo; // email or phone number
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private Boolean isVerified = false;
    
    @Column(nullable = false)
    private Boolean isExpired = false;
    
    @Column(nullable = false)
    private Integer attemptCount = 0;
    
    @Column(nullable = false)
    private Integer maxAttempts = 3;
    
    private LocalDateTime verifiedAt;
    
    @Column(length = 45)
    private String ipAddress;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (expiresAt == null) {
            expiresAt = LocalDateTime.now().plusMinutes(10); // Default 10 minutes
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public boolean isValid() {
        return !isExpired && !isVerified && LocalDateTime.now().isBefore(expiresAt) && attemptCount < maxAttempts;
    }
    
    public void incrementAttempt() {
        this.attemptCount++;
        if (this.attemptCount >= maxAttempts) {
            this.isExpired = true;
        }
    }
    
    public void markAsVerified() {
        this.isVerified = true;
        this.verifiedAt = LocalDateTime.now();
    }
}
