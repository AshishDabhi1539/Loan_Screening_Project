package com.tss.loan.entity.configuration;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.FraudTagType;
import com.tss.loan.entity.user.User;

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
@Table(name = "fraud_rules", indexes = {
        @Index(name = "idx_fraud_rule_code", columnList = "ruleCode", unique = true),
        @Index(name = "idx_fraud_rule_type", columnList = "fraudTagType"),
        @Index(name = "idx_fraud_rule_active", columnList = "isActive"),
        @Index(name = "idx_fraud_rule_priority", columnList = "priority")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class FraudRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String ruleCode;
    
    @Column(nullable = false, length = 200)
    private String ruleName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FraudTagType fraudTagType;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String ruleCondition; // JSON or expression format
    
    @Column(nullable = false)
    private Integer riskScore;
    
    @Column(nullable = false, length = 20)
    private String severity; // LOW, MEDIUM, HIGH, CRITICAL
    
    @Column(nullable = false)
    private Integer priority = 100;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean stopOnMatch = false;
    
    @Column(columnDefinition = "TEXT")
    private String actionOnMatch;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by_id")
    private User updatedBy;
    
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
    
    public boolean isHighPriority() {
        return priority <= 10;
    }
}
