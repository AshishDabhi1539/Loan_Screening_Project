package com.tss.loan.entity.user;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.enums.RoleType;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
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

@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email", unique = true),
        @Index(name = "idx_users_phone", columnList = "phone", unique = true),
        @Index(name = "idx_users_status_role", columnList = "status,role"),
        @Index(name = "idx_users_created_at", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 64)
    private String firstName;
    
    @Column(nullable = false, length = 64)
    private String lastName;
    
    @Column(nullable = false, unique = true, length = 128)
    private String email;
    
    @Column(nullable = false, unique = true, length = 15)
    private String phone;
    
    @Column(nullable = false)
    private String passwordHash;
    
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    
    @Column(length = 10)
    private String gender;
    
    @Column(columnDefinition = "TEXT")
    private String address;
    
    @Column(length = 100)
    private String city;
    
    @Column(length = 100)
    private String state;
    
    @Column(length = 100)
    private String country = "India";
    
    @Column(length = 6)
    private String pincode;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType role;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;
    
    @Column(nullable = false)
    private Boolean isEmailVerified = false;
    
    @Column(nullable = false)
    private Boolean isPhoneVerified = false;
    
    @Column(nullable = false)
    private Integer failedLoginAttempts = 0;
    
    private LocalDateTime lastLoginAt;
    
    private LocalDateTime passwordChangedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @OneToMany(mappedBy = "applicant", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<com.tss.loan.entity.loan.LoanApplication> loanApplications;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (passwordChangedAt == null) {
            passwordChangedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public String getFullName() {
        return firstName + " " + lastName;
    }
}
