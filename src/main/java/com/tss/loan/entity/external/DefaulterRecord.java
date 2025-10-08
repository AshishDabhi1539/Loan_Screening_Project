package com.tss.loan.entity.external;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.loan.entity.enums.RiskLevel;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "defaulter_records", indexes = {
        @Index(name = "idx_defaulter_pan", columnList = "panNumber"),
        @Index(name = "idx_defaulter_aadhaar", columnList = "aadhaarNumber"),
        @Index(name = "idx_defaulter_phone", columnList = "phoneNumber"),
        @Index(name = "idx_defaulter_email", columnList = "email"),
        @Index(name = "idx_defaulter_risk", columnList = "riskLevel"),
        @Index(name = "idx_defaulter_updated", columnList = "lastUpdated")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class DefaulterRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(length = 10)
    private String panNumber;
    
    @Column(length = 12)
    private String aadhaarNumber;
    
    @Column(length = 15)
    private String phoneNumber;
    
    @Column(length = 150)
    private String email;
    
    @Column(nullable = false, length = 100)
    private String fullName;
    
    @Column(nullable = false)
    private LocalDate dateOfBirth;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal defaultAmount;
    
    @Column(nullable = false)
    private Integer daysPastDue;
    
    @Column(nullable = false, length = 100)
    private String lenderName;
    
    @Column(nullable = false)
    private LocalDate defaultDate;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @Column(columnDefinition = "TEXT")
    private String fraudTags;
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private LocalDateTime lastUpdated;
    
    @Column(nullable = false, length = 100)
    private String dataSource; // External Authority name
    
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
        if (lastUpdated == null) {
            lastUpdated = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        lastUpdated = LocalDateTime.now();
    }
    
    public boolean isHighRisk() {
        return riskLevel == RiskLevel.HIGH || riskLevel == RiskLevel.VERY_HIGH || riskLevel == RiskLevel.CRITICAL;
    }
    
    public boolean isRecentDefault() {
        return defaultDate.isAfter(LocalDate.now().minusYears(2));
    }
}
