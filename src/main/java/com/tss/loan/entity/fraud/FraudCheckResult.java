    package com.tss.loan.entity.fraud;

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
    @Table(name = "fraud_check_results", indexes = {
            @Index(name = "idx_fraud_application", columnList = "loan_application_id"),
            @Index(name = "idx_fraud_risk", columnList = "riskLevel"),
            @Index(name = "idx_fraud_score", columnList = "fraudScore"),
            @Index(name = "idx_fraud_checked", columnList = "checkedAt")
    })
    @RequiredArgsConstructor
    @AllArgsConstructor
    @Data
    public class FraudCheckResult {
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        
        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "loan_application_id", nullable = false)
        private LoanApplication loanApplication;
        
        // EXTERNAL API RESPONSE DATA
        @Column(nullable = false)
        private Integer fraudScore; // 0-100
        
        @Enumerated(EnumType.STRING)
        @Column(nullable = false)
        private RiskLevel riskLevel;
        
        @Column(nullable = false)
        private Boolean isDefaulterFound = false;
        
        @Column(columnDefinition = "TEXT")
        private String fraudReasons;
        
        @Column(columnDefinition = "TEXT")
        private String fraudTags; // Merged from FraudTag entity
        
        // CREDIT HISTORY DATA (Merged from ApplicantCreditHistory)
        @Column
        private Integer creditScore;
        
        @Column(length = 50)
        private String creditBureau; // CIBIL, Experian, etc.
        
        @Column
        private Integer totalActiveLoans = 0;
        
        @Column(precision = 15, scale = 2)
        private java.math.BigDecimal totalOutstandingDebt = java.math.BigDecimal.ZERO;
        
        @Column
        private Integer defaultsCount = 0;
        
        @Column(nullable = false)
        private Boolean bankruptcyFiled = false;
        
        // EXTERNAL API DETAILS
        @Column(length = 100)
        private String apiEndpoint; // Which external API was called
        
        @Column(columnDefinition = "TEXT")
        private String apiResponse; // Raw API response for audit
        
        @Column(nullable = false)
        private LocalDateTime checkedAt;
        
        @Column(length = 100)
        private String checkedBy;
        
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
            if (checkedAt == null) {
                checkedAt = LocalDateTime.now();
            }
        }
        
        @PreUpdate
        protected void onUpdate() {
            updatedAt = LocalDateTime.now();
        }
    }
