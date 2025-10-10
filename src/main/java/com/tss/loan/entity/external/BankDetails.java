package com.tss.loan.entity.external;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * External Bank Details Entity
 * Represents banking information from external financial databases
 */
@Entity
@Table(name = "bank_details", 
    indexes = {
        @Index(name = "idx_bank_aadhaar", columnList = "aadhaarNumber"),
        @Index(name = "idx_bank_pan", columnList = "panNumber"),
        @Index(name = "idx_bank_account", columnList = "accountNumber", unique = true),
        @Index(name = "idx_bank_updated", columnList = "lastUpdated")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_bank_details", 
            columnNames = {"aadhaarNumber", "panNumber", "bankName"})
    }
)
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class BankDetails {
    
    @Id
    @GeneratedValue
    @Column(name = "bank_id")
    private UUID bankId;
    
    @Column(name = "aadhaar_number", nullable = false, length = 12)
    private String aadhaarNumber;
    
    @Column(name = "pan_number", nullable = false, length = 10)
    private String panNumber;
    
    @Column(name = "bank_name", length = 100)
    private String bankName;
    
    @Column(name = "account_number", length = 25, unique = true)
    private String accountNumber;
    
    @Column(name = "account_type", length = 20)
    private String accountType; // SAVINGS, CURRENT, SALARY
    
    @Column(name = "salary_account_flag", nullable = false)
    private Boolean salaryAccountFlag = false;
    
    @Column(name = "average_monthly_balance", precision = 12, scale = 2)
    private BigDecimal averageMonthlyBalance;
    
    @Column(name = "monthly_income", precision = 12, scale = 2)
    private BigDecimal monthlyIncome;
    
    @Column(name = "monthly_expense", precision = 12, scale = 2)
    private BigDecimal monthlyExpense;
    
    @Column(name = "overdraft_used", nullable = false)
    private Boolean overdraftUsed = false;
    
    @Column(name = "cheque_bounce_count", nullable = false)
    private Integer chequeBounceCount = 0;
    
    @Column(name = "credit_card_usage_ratio", precision = 5, scale = 2)
    private BigDecimal creditCardUsageRatio;
    
    @Column(name = "account_age_years", precision = 5, scale = 2)
    private BigDecimal accountAgeYears;
    
    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;
    
    @PrePersist
    protected void onCreate() {
        if (lastUpdated == null) {
            lastUpdated = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        lastUpdated = LocalDateTime.now();
    }
    
    // Business methods
    public boolean isHighRiskAccount() {
        return (chequeBounceCount != null && chequeBounceCount > 3) ||
               (overdraftUsed != null && overdraftUsed) ||
               (creditCardUsageRatio != null && creditCardUsageRatio.compareTo(new BigDecimal("80")) > 0);
    }
    
    public BigDecimal getNetMonthlyFlow() {
        if (monthlyIncome == null || monthlyExpense == null) {
            return BigDecimal.ZERO;
        }
        return monthlyIncome.subtract(monthlyExpense);
    }
    
    public boolean isStableAccount() {
        return accountAgeYears != null && accountAgeYears.compareTo(new BigDecimal("2")) >= 0 &&
               chequeBounceCount != null && chequeBounceCount <= 1;
    }
}
