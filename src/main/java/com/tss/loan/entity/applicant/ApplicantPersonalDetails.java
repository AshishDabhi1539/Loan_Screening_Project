package com.tss.loan.entity.applicant;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "applicant_personal_details", indexes = {
        @Index(name = "idx_personal_user", columnList = "user_id", unique = true),
        @Index(name = "idx_personal_pan", columnList = "panNumber", unique = true),
        @Index(name = "idx_personal_aadhaar", columnList = "aadhaarNumber", unique = true),
        @Index(name = "idx_personal_phone", columnList = "phoneNumber")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantPersonalDetails {
    @Id
    @GeneratedValue
    private UUID id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private com.tss.loan.entity.user.User user;
    
    // NAME FIELDS - Single source of truth for user identity
    @Column(nullable = false, length = 50)
    private String firstName;
    
    @Column(nullable = false, length = 50)
    private String lastName;
    
    @Column(length = 50)
    private String middleName;
    
    @Column(nullable = false, length = 10, unique = true)
    private String panNumber;
    
    @Column(nullable = false, length = 12, unique = true)
    private String aadhaarNumber;
    
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    
    @Column(nullable = false, length = 10)
    private String gender; // MALE, FEMALE, OTHER
    
    @Column(nullable = false, length = 50)
    private String maritalStatus; // SINGLE, MARRIED, DIVORCED, WIDOWED
    
    @Column(nullable = false, length = 15)
    private String phoneNumber;
    
    @Column(length = 15)
    private String alternatePhoneNumber;
    
    @Column(nullable = false, length = 150)
    private String emailAddress;
    
    // REMOVED: Income moved to ApplicantFinancialProfile
    // @Column(precision = 15, scale = 2)
    // private BigDecimal declaredAnnualIncome; // ✗ Moved to financial profile
    
    @Column(nullable = false, length = 100)
    private String nationality = "Indian";
    
    @Column(columnDefinition = "TEXT")
    private String currentAddress;
    
    @Column(length = 100)
    private String currentCity;
    
    @Column(length = 100)
    private String currentState;
    
    @Column(length = 6)
    private String currentPincode;
    
    @Column(columnDefinition = "TEXT")
    private String permanentAddress;
    
    @Column(length = 100)
    private String permanentCity;
    
    @Column(length = 100)
    private String permanentState;
    
    @Column(length = 6)
    private String permanentPincode;
    
    @Column(nullable = false)
    private Boolean isSameAddress = false; // current == permanent
    
    @Column(nullable = false)
    private Integer dependentsCount = 0;
    
    @Column(length = 100)
    private String fatherName;
    
    @Column(length = 100)
    private String motherName;
    
    @Column(length = 100)
    private String spouseName;
    
    // ========== VERIFICATION STATUS ==========
    @Column(nullable = false)
    private Boolean identityVerified = false;
    
    @Column(nullable = false)
    private Boolean addressVerified = false;
    
    @Column(columnDefinition = "TEXT")
    private String identityVerificationNotes;
    
    @Column(columnDefinition = "TEXT")
    private String addressVerificationNotes;
    
    private LocalDateTime identityVerifiedAt;
    private LocalDateTime addressVerifiedAt;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Get complete full name for display and official use
     * Format: firstName [middleName] lastName
     */
    public String getFullName() {
        StringBuilder name = new StringBuilder(firstName.trim());
        if (middleName != null && !middleName.trim().isEmpty()) {
            name.append(" ").append(middleName.trim());
        }
        name.append(" ").append(lastName.trim());
        return name.toString();
    }
    
    /**
     * Get formal name for official documents
     * Format: lastName, firstName [middleName]
     */
    public String getFormalName() {
        StringBuilder name = new StringBuilder(lastName.trim()).append(", ").append(firstName.trim());
        if (middleName != null && !middleName.trim().isEmpty()) {
            name.append(" ").append(middleName.trim());
        }
        return name.toString();
    }
    
    public Integer getAge() {
        return java.time.Period.between(dateOfBirth, LocalDate.now()).getYears();
    }
    
    public boolean isMinorAge() {
        return getAge() < 18;
    }
    
    public boolean isSeniorCitizen() {
        return getAge() >= 60;
    }
}
