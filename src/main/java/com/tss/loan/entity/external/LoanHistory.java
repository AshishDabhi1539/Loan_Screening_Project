package com.tss.loan.entity.external;

import java.math.BigDecimal;
import java.time.LocalDate;
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
 * External Loan History Entity
 * Represents loan history from external credit bureaus and financial institutions
 */
@Entity
@Table(name = "loan_history",
    indexes = {
        @Index(name = "idx_loan_aadhaar", columnList = "aadhaar_number"),
        @Index(name = "idx_loan_pan", columnList = "pan_number")
    }
)
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class LoanHistory {
    
    @Id
    @GeneratedValue
    @Column(name = "loan_id")
    private UUID loanId;
    
    @Column(name = "aadhaar_number", nullable = false, length = 12)
    private String aadhaarNumber;
    
    @Column(name = "pan_number", nullable = false, length = 10)
    private String panNumber;
    
    @Column(name = "loan_type", length = 50)
    private String loanType; // Home, Auto, Personal, Credit Card
    
    @Column(name = "loan_amount", precision = 12, scale = 2)
    private BigDecimal loanAmount;
    
    @Column(name = "credit_limit", precision = 12, scale = 2)
    private BigDecimal creditLimit;
    
    @Column(name = "current_outstanding", precision = 12, scale = 2)
    private BigDecimal currentOutstanding;
    
    @Column(name = "emi_amount", precision = 10, scale = 2)
    private BigDecimal emiAmount;
    
    @Column(name = "tenure_months")
    private Integer tenureMonths;
    
    @Column(name = "interest_rate", precision = 5, scale = 2)
    private BigDecimal interestRate;
    
    @Column(name = "start_date")
    private LocalDate startDate;
    
    @Column(name = "end_date")
    private LocalDate endDate;
    
    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;
    
    @Column(name = "missed_payments", nullable = false)
    private Integer missedPayments = 0;
    
    @Column(name = "late_payment_count", nullable = false)
    private Integer latePaymentCount = 0;
    
    @Column(name = "default_flag", nullable = false)
    private Boolean defaultFlag = false;
    
    @Column(name = "secured_flag", nullable = false)
    private Boolean securedFlag = false;
    
    @Column(name = "loan_status", length = 20)
    private String loanStatus = "Active"; // Active, Closed, Defaulted, Settled
    
    @Column(name = "dti_ratio", precision = 5, scale = 2)
    private BigDecimal dtiRatio; // Debt-to-Income Ratio
    
    @Column(name = "closed_loans_count", nullable = false)
    private Integer closedLoansCount = 0;
    
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
    public boolean isHighRiskLoan() {
        return (defaultFlag != null && defaultFlag) ||
               (missedPayments != null && missedPayments > 3) ||
               (latePaymentCount != null && latePaymentCount > 6) ||
               (dtiRatio != null && dtiRatio.compareTo(new BigDecimal("40")) > 0);
    }
    
    public boolean isActiveLoan() {
        return "Active".equalsIgnoreCase(loanStatus) && 
               (endDate == null || endDate.isAfter(LocalDate.now()));
    }
    
    public BigDecimal getUtilizationRatio() {
        if (creditLimit == null || creditLimit.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (currentOutstanding == null) {
            return BigDecimal.ZERO;
        }
        return currentOutstanding.divide(creditLimit, 4, java.math.RoundingMode.HALF_UP)
                                .multiply(new BigDecimal("100"));
    }
    
    public boolean isGoodPaymentHistory() {
        return (missedPayments == null || missedPayments <= 1) &&
               (latePaymentCount == null || latePaymentCount <= 2) &&
               (defaultFlag == null || !defaultFlag);
    }
    
    public int getRemainingTenureMonths() {
        if (startDate == null || tenureMonths == null) {
            return 0;
        }
        LocalDate expectedEndDate = startDate.plusMonths(tenureMonths);
        LocalDate now = LocalDate.now();
        if (expectedEndDate.isBefore(now)) {
            return 0;
        }
        return (int) java.time.temporal.ChronoUnit.MONTHS.between(now, expectedEndDate);
    }
}
