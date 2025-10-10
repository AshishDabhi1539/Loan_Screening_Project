package com.tss.loan.entity.external;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * External Credit Score History Entity
 * Represents credit score history from external credit bureaus (CIBIL, Experian, etc.)
 */
@Entity
@Table(name = "credit_score_history",
    indexes = {
        @Index(name = "idx_credit_aadhaar", columnList = "aadhaarNumber"),
        @Index(name = "idx_credit_pan", columnList = "panNumber"),
        @Index(name = "idx_credit_score", columnList = "creditScore"),
        @Index(name = "idx_credit_risk", columnList = "riskScore"),
        @Index(name = "idx_credit_computed", columnList = "computedDate")
    }
)
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class CreditScoreHistory {
    
    @Id
    @GeneratedValue
    @Column(name = "score_id")
    private UUID scoreId;
    
    @Column(name = "aadhaar_number", nullable = false, length = 12)
    private String aadhaarNumber;
    
    @Column(name = "pan_number", nullable = false, length = 10)
    private String panNumber;
    
    @Column(name = "credit_score")
    private Integer creditScore; // 300-900 range
    
    @Enumerated(EnumType.STRING)
    @Column(name = "risk_score", length = 10)
    private RiskScore riskScore;
    
    @Column(name = "total_loans")
    private Integer totalLoans;
    
    @Column(name = "total_defaults")
    private Integer totalDefaults;
    
    @Column(name = "fraud_cases")
    private Integer fraudCases;
    
    @Column(name = "avg_monthly_income", precision = 12, scale = 2)
    private BigDecimal avgMonthlyIncome;
    
    @Column(name = "avg_outstanding_amount", precision = 12, scale = 2)
    private BigDecimal avgOutstandingAmount;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "computed_date", nullable = false)
    private LocalDateTime computedDate;
    
    // Enum for risk scores
    public enum RiskScore {
        LOW, MEDIUM, HIGH
    }
    
    @PrePersist
    protected void onCreate() {
        if (computedDate == null) {
            computedDate = LocalDateTime.now();
        }
    }
    
    // Business methods
    public boolean isExcellentScore() {
        return creditScore != null && creditScore >= 750;
    }
    
    public boolean isGoodScore() {
        return creditScore != null && creditScore >= 650 && creditScore < 750;
    }
    
    public boolean isFairScore() {
        return creditScore != null && creditScore >= 550 && creditScore < 650;
    }
    
    public boolean isPoorScore() {
        return creditScore != null && creditScore < 550;
    }
    
    public String getCreditRating() {
        if (creditScore == null) {
            return "UNKNOWN";
        }
        if (creditScore >= 750) {
            return "EXCELLENT";
        } else if (creditScore >= 650) {
            return "GOOD";
        } else if (creditScore >= 550) {
            return "FAIR";
        } else {
            return "POOR";
        }
    }
    
    public boolean isHighRisk() {
        return RiskScore.HIGH.equals(riskScore) ||
               (totalDefaults != null && totalDefaults > 0) ||
               (fraudCases != null && fraudCases > 0) ||
               isPoorScore();
    }
    
    public boolean isLowRisk() {
        return RiskScore.LOW.equals(riskScore) &&
               (totalDefaults == null || totalDefaults == 0) &&
               (fraudCases == null || fraudCases == 0) &&
               isExcellentScore();
    }
    
    public BigDecimal getDebtToIncomeRatio() {
        if (avgMonthlyIncome == null || avgMonthlyIncome.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        if (avgOutstandingAmount == null) {
            return BigDecimal.ZERO;
        }
        return avgOutstandingAmount.divide(avgMonthlyIncome, 4, java.math.RoundingMode.HALF_UP)
                                  .multiply(new BigDecimal("100"));
    }
    
    public boolean hasCleanRecord() {
        return (totalDefaults == null || totalDefaults == 0) &&
               (fraudCases == null || fraudCases == 0) &&
               (creditScore != null && creditScore >= 650);
    }
    
    public int getDaysOld() {
        if (computedDate == null) {
            return 0;
        }
        return (int) java.time.temporal.ChronoUnit.DAYS.between(
            computedDate.toLocalDate(), 
            LocalDateTime.now().toLocalDate()
        );
    }
    
    public boolean isRecentScore() {
        return getDaysOld() <= 90; // Within last 3 months
    }
}
