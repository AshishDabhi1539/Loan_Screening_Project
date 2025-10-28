package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.VerificationStatus;
import com.tss.loan.entity.loan.LoanApplication;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * OPTIMIZED: Combines Employment + Financial data to avoid redundancy
 * Single source of truth for all financial and employment information
 */
@Entity
@Table(name = "applicant_financial_profile", indexes = {
        @Index(name = "idx_fin_profile_application", columnList = "loan_application_id", unique = true),
        @Index(name = "idx_fin_profile_income", columnList = "primaryMonthlyIncome"),
        @Index(name = "idx_fin_profile_employment", columnList = "employmentType"),
        @Index(name = "idx_fin_profile_emp_verification", columnList = "employmentVerificationStatus"),
        @Index(name = "idx_fin_profile_income_verification", columnList = "incomeVerificationStatus")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantFinancialProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false, unique = true)
    private LoanApplication loanApplication;
    
    // ========== EMPLOYMENT DETAILS ==========
    @Column(nullable = false, length = 200)
    private String employerName;
    
    @Column(nullable = false, length = 100)
    private String designation;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmploymentType employmentType;
    
    @Column(nullable = false)
    private LocalDate employmentStartDate;
    
    @Column(length = 200)
    private String workAddress;
    
    @Column(length = 100)
    private String workCity;
    
    @Column(length = 15)
    private String workPhone;
    
    @Column(length = 150)
    private String workEmail;
    
    // ========== COMPANY CONTACT DETAILS ==========
    @Column(length = 15)
    private String hrPhone;
    
    @Column(length = 150)
    private String hrEmail;
    
    @Column(length = 100)
    private String managerName;
    
    @Column(length = 15)
    private String managerPhone;
    
    @Column(length = 200)
    private String companyAddress;
    
    // ========== INCOME DETAILS ==========
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal primaryMonthlyIncome; // From employment
    
    @Column(precision = 12, scale = 2)
    private BigDecimal secondaryIncome = BigDecimal.ZERO; // Rental, business, etc.
    
    @Column(precision = 12, scale = 2)
    private BigDecimal otherIncome = BigDecimal.ZERO; // Investment, freelance, etc.
    
    // ========== EXPENSE DETAILS ==========
    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyExpenses = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal existingEmiAmount = BigDecimal.ZERO;
    
    // ========== BANKING DETAILS ==========
    @Column(length = 150)
    private String primaryBankName;
    
    @Column(length = 50)
    private String primaryAccountNumber;
    
    @Column(length = 50)
    private String accountType; // SAVINGS, CURRENT, SALARY
    
    @Column(length = 20)
    private String ifscCode;
    
    @Column(length = 100)
    private String branchName;
    
    // ========== BANK STATEMENT ANALYSIS ==========
    @Column(precision = 15, scale = 2)
    private BigDecimal avgMonthlyCredits; // Last 6 months average
    
    @Column(precision = 15, scale = 2)
    private BigDecimal avgMonthlyDebits; // Last 6 months average
    
    @Column(precision = 5, scale = 2)
    private BigDecimal salaryConsistencyRatio; // Income consistency %
    
    @Column(columnDefinition = "TEXT")
    private String financialAnomalies; // Red flags from bank statement
    
    // ========== VERIFICATION STATUS ==========
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus employmentVerificationStatus = VerificationStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus incomeVerificationStatus = VerificationStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus bankVerificationStatus = VerificationStatus.PENDING;
    
    @Column(columnDefinition = "TEXT")
    private String verificationNotes;
    
    private LocalDateTime employmentVerifiedAt;
    private LocalDateTime incomeVerifiedAt;
    private LocalDateTime bankVerifiedAt;
    
    // ========== AUDIT FIELDS ==========
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
    
    // ========== BUSINESS LOGIC METHODS ==========
    public BigDecimal getTotalMonthlyIncome() {
        BigDecimal total = primaryMonthlyIncome != null ? primaryMonthlyIncome : BigDecimal.ZERO;
        total = total.add(secondaryIncome != null ? secondaryIncome : BigDecimal.ZERO);
        total = total.add(otherIncome != null ? otherIncome : BigDecimal.ZERO);
        return total;
    }
    
    public BigDecimal getNetDisposableIncome() {
        BigDecimal totalIncome = getTotalMonthlyIncome();
        BigDecimal totalExpenses = monthlyExpenses != null ? monthlyExpenses : BigDecimal.ZERO;
        BigDecimal existingEmi = existingEmiAmount != null ? existingEmiAmount : BigDecimal.ZERO;
        return totalIncome.subtract(totalExpenses).subtract(existingEmi);
    }
    
    public BigDecimal getAnnualIncome() {
        return getTotalMonthlyIncome().multiply(new BigDecimal("12"));
    }
    
    public Integer getExperienceInMonths() {
        if (employmentStartDate == null) return 0;
        return (int) java.time.temporal.ChronoUnit.MONTHS.between(employmentStartDate, LocalDate.now());
    }
    
    public Integer getExperienceInYears() {
        return getExperienceInMonths() / 12;
    }
    
    public boolean isIncomeStable() {
        return salaryConsistencyRatio != null && salaryConsistencyRatio.compareTo(new BigDecimal("80")) >= 0;
    }
    
    public boolean hasFinancialAnomalies() {
        return financialAnomalies != null && !financialAnomalies.trim().isEmpty();
    }
    
    public boolean isFullyVerified() {
        return employmentVerificationStatus == VerificationStatus.VERIFIED &&
               incomeVerificationStatus == VerificationStatus.VERIFIED &&
               bankVerificationStatus == VerificationStatus.VERIFIED;
    }
}
