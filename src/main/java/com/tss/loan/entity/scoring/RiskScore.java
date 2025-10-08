package com.tss.loan.entity.scoring;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import com.tss.loan.entity.enums.RiskLevel;
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
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "risk_scores", indexes = {
        @Index(name = "idx_risk_application", columnList = "loan_application_id"),
        @Index(name = "idx_risk_level", columnList = "riskLevel"),
        @Index(name = "idx_risk_score", columnList = "totalScore"),
        @Index(name = "idx_risk_calculated", columnList = "calculatedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class RiskScore {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Column(nullable = false)
    private Integer totalScore;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;
    
    // Individual component scores
    @Column(nullable = false)
    private Integer creditScore = 0;
    
    @Column(nullable = false)
    private Integer incomeScore = 0;
    
    @Column(nullable = false)
    private Integer employmentScore = 0;
    
    @Column(nullable = false)
    private Integer fraudScore = 0;
    
    @Column(nullable = false)
    private Integer documentScore = 0;
    
    @Column(nullable = false)
    private Integer behaviorScore = 0;
    
    // Weightages for scoring
    @Column(precision = 5, scale = 2)
    private BigDecimal creditWeight = new BigDecimal("0.30");
    
    @Column(precision = 5, scale = 2)
    private BigDecimal incomeWeight = new BigDecimal("0.25");
    
    @Column(precision = 5, scale = 2)
    private BigDecimal employmentWeight = new BigDecimal("0.20");
    
    @Column(precision = 5, scale = 2)
    private BigDecimal fraudWeight = new BigDecimal("0.15");
    
    @Column(precision = 5, scale = 2)
    private BigDecimal documentWeight = new BigDecimal("0.05");
    
    @Column(precision = 5, scale = 2)
    private BigDecimal behaviorWeight = new BigDecimal("0.05");
    
    @Column(columnDefinition = "TEXT")
    private String scoreBreakdown;
    
    @Column(length = 100)
    private String calculatedBy;
    
    @Column(nullable = false)
    private LocalDateTime calculatedAt;
    
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
        if (calculatedAt == null) {
            calculatedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public void calculateTotalScore() {
        double weightedScore = (creditScore * creditWeight.doubleValue()) +
                              (incomeScore * incomeWeight.doubleValue()) +
                              (employmentScore * employmentWeight.doubleValue()) +
                              (fraudScore * fraudWeight.doubleValue()) +
                              (documentScore * documentWeight.doubleValue()) +
                              (behaviorScore * behaviorWeight.doubleValue());
        
        this.totalScore = (int) Math.round(weightedScore);
        this.riskLevel = RiskLevel.fromScore(this.totalScore);
    }
    
    public boolean isHighRisk() {
        return riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.VERY_HIGH || riskLevel == RiskLevel.CRITICAL;
    }
}
