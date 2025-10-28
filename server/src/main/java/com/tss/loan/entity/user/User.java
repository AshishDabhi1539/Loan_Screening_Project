package com.tss.loan.entity.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.enums.RoleType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * OPTIMIZED: Authentication and role management only
 * All personal details moved to ApplicantPersonalDetails
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_phone", columnList = "phone", unique = true),
        @Index(name = "idx_users_role", columnList = "role"),
        @Index(name = "idx_users_status", columnList = "status")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class User {
    @Id
    @GeneratedValue
    private UUID id;
    
    // AUTHENTICATION FIELDS
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    
    @Column(nullable = false)
    private String passwordHash;
    
    // ROLE & STATUS
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
    
    // VERIFICATION STATUS
    @Column(nullable = false)
    private Boolean isEmailVerified = false;
    
    @Column(nullable = false)
    private Boolean isPhoneVerified = true; // Auto-verified for now (no WhatsApp)
    
    // SECURITY
    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;
    
    private LocalDateTime lastLoginAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    // RELATIONSHIPS - Only essential ones
    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<com.tss.loan.entity.loan.LoanApplication> loanApplications;
    
    @OneToMany(mappedBy = "assignedOfficer", fetch = FetchType.LAZY)
    private List<com.tss.loan.entity.loan.LoanApplication> assignedApplications;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Business methods
    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }
    
    public boolean isVerified() {
        return isEmailVerified && isPhoneVerified;
    }
}
