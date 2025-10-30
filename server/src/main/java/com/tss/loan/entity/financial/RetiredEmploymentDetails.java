package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
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
 * Retired Employment Details
 * For pensioners and retirees
 */
@Entity
@Table(name = "retired_employment_details", indexes = {
        @Index(name = "idx_ret_emp_profile", columnList = "financial_profile_id", unique = true),
        @Index(name = "idx_ret_pension_type", columnList = "pensionType")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class RetiredEmploymentDetails {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "financial_profile_id", nullable = false, unique = true)
    private ApplicantFinancialProfile financialProfile;
    
    @Column(nullable = false, length = 50)
    private String pensionType; // GOVERNMENT, PRIVATE, PPF, MILITARY, OTHER
    
    @Column(nullable = false, length = 200)
    private String pensionProvider; // Organization providing pension
    
    @Column(length = 100)
    private String ppoNumber; // Pension Payment Order number (for govt employees)
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyPensionAmount; // Regular monthly pension
    
    @Column(nullable = false)
    private LocalDate retirementDate; // Date of retirement
    
    @Column(nullable = false, length = 200)
    private String previousEmployer; // Last employer before retirement
    
    @Column(nullable = false, length = 100)
    private String previousDesignation; // Last job title
    
    @Column
    private Integer yearsOfService; // Total years worked
    
    @Column(length = 50)
    private String pensionAccountNumber; // Bank account for pension credit
    
    @Column(length = 150)
    private String pensionBankName; // Bank where pension is credited
    
    @Column(columnDefinition = "TEXT")
    private String additionalRetirementBenefits; // Medical, gratuity, etc.
    
    @Column(precision = 12, scale = 2)
    private BigDecimal gratuityAmount; // One-time gratuity received
    
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
     * Calculate years since retirement
     */
    public Integer getYearsSinceRetirement() {
        if (retirementDate == null) return 0;
        return (int) java.time.temporal.ChronoUnit.YEARS.between(retirementDate, LocalDate.now());
    }
}
