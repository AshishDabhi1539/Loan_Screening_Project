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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "login_attempts", indexes = {
        @Index(name = "idx_login_user", columnList = "user_id"),
        @Index(name = "idx_login_ip", columnList = "ipAddress"),
        @Index(name = "idx_login_success", columnList = "isSuccessful"),
        @Index(name = "idx_login_timestamp", columnList = "attemptTime")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class LoginAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @Column(length = 150)
    private String username;
    
    @Column(nullable = false, length = 45)
    private String ipAddress;
    
    @Column(length = 500)
    private String userAgent;
    
    @Column(nullable = false)
    private Boolean isSuccessful;
    
    @Column(length = 200)
    private String failureReason;
    
    @Column(nullable = false)
    private LocalDateTime attemptTime;
    
    @Column(length = 100)
    private String sessionId;
    
    @Column(length = 100)
    private String deviceFingerprint;
    
    @PrePersist
    protected void onCreate() {
        if (attemptTime == null) {
            attemptTime = LocalDateTime.now();
        }
    }
}
