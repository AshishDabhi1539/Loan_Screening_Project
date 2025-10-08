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
@Table(name = "applicant_credit_history", indexes = {
        @Index(name = "idx_credit_application", columnList = "loan_application_id"),
        @Index(name = "idx_credit_score", columnList = "creditScore"),
        @Index(name = "idx_credit_bureau", columnList = "creditBureau"),
        @Index(name = "idx_credit_checked", columnList = "lastCheckedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicantCreditHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Column(nullable = false)
    private Integer creditScore;
    
    @Column(nullable = false, length = 50)
    private String creditBureau; // CIBIL, Experian, Equifax, CRIF
    
    @Column(nullable = false)
    private Integer totalActiveLoans = 0;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalOutstandingDebt = BigDecimal.ZERO;
    
    @Column(precision = 12, scale = 2)
    private BigDecimal totalMonthlyEmi = BigDecimal.ZERO;
    
    @Column(nullable = false)
    private Integer creditCardCount = 0;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal totalCreditLimit = BigDecimal.ZERO;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal creditUtilizationRatio = BigDecimal.ZERO;
    
    @Column(length = 50)
    private String paymentHistory; // excellent, good, fair, poor
    
    @Column(nullable = false)
    private Integer defaultsCount = 0;
    
    @Column(nullable = false)
    private Boolean bankruptcyFiled = false;
    
    @Column(columnDefinition = "TEXT")
    private String creditReportUrl;
    
    private LocalDateTime lastCheckedAt;
    
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
    
    public boolean isGoodCreditScore() {
        return creditScore >= 750;
    }
    
    public boolean isFairCreditScore() {
        return creditScore >= 650 && creditScore < 750;
    }
    
    public boolean isPoorCreditScore() {
        return creditScore < 650;
    }
}
