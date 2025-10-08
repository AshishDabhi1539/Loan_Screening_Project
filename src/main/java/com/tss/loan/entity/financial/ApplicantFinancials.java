package com.tss.loan.entity.financial;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.loan.entity.loan.LoanApplication;

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
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "applicant_financials", indexes = {
        @Index(name = "idx_fin_application", columnList = "loan_application_id"),
        @Index(name = "idx_fin_income", columnList = "monthlyIncome"),
        @Index(name = "idx_fin_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantFinancials {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monthlyIncome;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal otherIncome = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal monthlyExpenses = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal existingEmiAmount = BigDecimal.ZERO;
    
    @Column(length = 150)
    private String bankName;
    
    @Column(length = 50)
    private String accountNumber;
    
    @Column(length = 50)
    private String accountType;
    
    @Column(length = 20)
    private String ifscCode;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalCreditLastMonth;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalDebitLastMonth;
    
    @Column(columnDefinition = "TEXT")
    private String anomalies;
    
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
    
    public BigDecimal getTotalIncome() {
        return monthlyIncome.add(otherIncome != null ? otherIncome : BigDecimal.ZERO);
    }
    
    public BigDecimal getNetIncome() {
        BigDecimal totalIncome = getTotalIncome();
        BigDecimal totalExpenses = monthlyExpenses != null ? monthlyExpenses : BigDecimal.ZERO;
        BigDecimal existingEmi = existingEmiAmount != null ? existingEmiAmount : BigDecimal.ZERO;
        return totalIncome.subtract(totalExpenses).subtract(existingEmi);
    }
}
