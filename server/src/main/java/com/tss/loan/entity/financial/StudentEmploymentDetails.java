package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Student Employment Details
 * For students applying for education loans
 * Includes guardian/co-applicant information
 */
@Entity
@Table(name = "student_employment_details", indexes = {
        @Index(name = "idx_stu_emp_profile", columnList = "financial_profile_id", unique = true),
        @Index(name = "idx_stu_institution", columnList = "institutionName"),
        @Index(name = "idx_stu_guardian", columnList = "guardianName")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class StudentEmploymentDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_profile_id", nullable = false, unique = true)
    private ApplicantFinancialProfile financialProfile;
    
    // ========== EDUCATION DETAILS ==========
    @Column(nullable = false, length = 200)
    private String institutionName; // College/University name
    
    @Column(length = 200)
    private String institutionAddress; // Full address
    
    @Column(length = 100)
    private String institutionCity;
    
    @Column(length = 50)
    private String institutionState;
    
    @Column(nullable = false, length = 150)
    private String courseName; // B.Tech, MBA, MBBS, etc.
    
    @Column(length = 100)
    private String specialization; // Computer Science, Finance, etc.
    
    @Column(nullable = false)
    private Integer yearOfStudy; // 1, 2, 3, 4
    
    @Column(nullable = false)
    private Integer totalCourseDuration; // Total years (4 for B.Tech, 2 for MBA)
    
    @Column(nullable = false)
    private Integer expectedGraduationYear; // Year of completion
    
    @Column(length = 50)
    private String studentIdNumber; // University roll number
    
    @Column(precision = 12, scale = 2)
    private BigDecimal currentCGPA; // Current grade point average
    
    // ========== GUARDIAN/CO-APPLICANT DETAILS ==========
    @Column(nullable = false, length = 150)
    private String guardianName; // Parent/Guardian full name
    
    @Column(nullable = false, length = 50)
    private String guardianRelation; // FATHER, MOTHER, LEGAL_GUARDIAN, SPOUSE
    
    @Column(nullable = false, length = 150)
    private String guardianOccupation; // Guardian's profession
    
    @Column(nullable = false, length = 200)
    private String guardianEmployer; // Guardian's company/employer
    
    @Column(length = 100)
    private String guardianDesignation; // Guardian's job title
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal guardianMonthlyIncome; // Guardian's monthly income
    
    @Column(precision = 12, scale = 2)
    private BigDecimal guardianAnnualIncome; // Guardian's yearly income
    
    @Column(nullable = false, length = 15)
    private String guardianContact; // Guardian's phone number
    
    @Column(length = 150)
    private String guardianEmail; // Guardian's email
    
    @Column(length = 200)
    private String guardianAddress; // Guardian's residential address
    
    @Column(length = 100)
    private String guardianCity;
    
    @Column(length = 50)
    private String guardianState;
    
    @Column(length = 10)
    private String guardianPincode;
    
    @Column(length = 20)
    private String guardianPanNumber; // Guardian's PAN for co-applicant verification
    
    @Column(length = 20)
    private String guardianAadharNumber; // Guardian's Aadhar
    
    // ========== ADDITIONAL FINANCIAL SUPPORT ==========
    @Column(precision = 12, scale = 2)
    private BigDecimal scholarshipAmount; // Any scholarship received
    
    @Column(length = 200)
    private String scholarshipProvider; // Scholarship source
    
    @Column(precision = 12, scale = 2)
    private BigDecimal familySavingsForEducation; // Savings allocated for education
    
    @Column(columnDefinition = "TEXT")
    private String additionalFinancialSupport; // Other sources (grandparents, trust, etc.)
    
    // ========== AUDIT FIELDS ==========
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
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
     * Calculate remaining years of study
     */
    public Integer getRemainingYears() {
        if (totalCourseDuration == null || yearOfStudy == null) return 0;
        return totalCourseDuration - yearOfStudy;
    }
    
    /**
     * Check if guardian details are complete
     */
    public boolean hasCompleteGuardianDetails() {
        return guardianName != null && guardianContact != null && 
               guardianMonthlyIncome != null && guardianEmployer != null;
    }
}
