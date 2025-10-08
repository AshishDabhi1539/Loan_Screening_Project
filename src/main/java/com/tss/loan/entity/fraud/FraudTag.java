package com.tss.loan.entity.fraud;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.FraudTagType;
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
@Table(name = "fraud_tags", indexes = {
        @Index(name = "idx_fraud_tag_application", columnList = "loan_application_id"),
        @Index(name = "idx_fraud_tag_type", columnList = "tagType"),
        @Index(name = "idx_fraud_tag_severity", columnList = "severity"),
        @Index(name = "idx_fraud_tag_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class FraudTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FraudTagType tagType;
    
    @Column(nullable = false, length = 200)
    private String description;
    
    @Column(nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(nullable = false)
    private Integer riskScore;
    
    @Column(columnDefinition = "TEXT")
    private String details;
    
    @Column(length = 100)
    private String detectedBy; // SYSTEM, MANUAL, EXTERNAL_API
    
    @Column(length = 100)
    private String dataSource;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
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
    
    public boolean isCritical() {
        return "CRITICAL".equals(severity);
    }
    
    public boolean isHigh() {
        return "HIGH".equals(severity);
    }
}
