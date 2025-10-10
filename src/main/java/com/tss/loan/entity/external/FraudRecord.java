package com.tss.loan.entity.external;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

/**
 * External Fraud Records Entity
 * Represents fraud records from external authorities and regulatory bodies
 */
@Entity
@Table(name = "fraud_records",
    indexes = {
        @Index(name = "idx_fraud_aadhaar", columnList = "aadhaarNumber"),
        @Index(name = "idx_fraud_pan", columnList = "panNumber"),
        @Index(name = "idx_fraud_type", columnList = "fraudType"),
        @Index(name = "idx_fraud_severity", columnList = "severityLevel"),
        @Index(name = "idx_fraud_resolved", columnList = "resolvedFlag"),
        @Index(name = "idx_fraud_reported", columnList = "reportedDate")
    },
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_fraud_records", 
            columnNames = {"aadhaarNumber", "panNumber", "fraudType", "reportedDate"})
    }
)
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class FraudRecord {
    
    @Id
    @GeneratedValue
    @Column(name = "fraud_id")
    private UUID fraudId;
    
    @Column(name = "aadhaar_number", nullable = false, length = 12)
    private String aadhaarNumber;
    
    @Column(name = "pan_number", nullable = false, length = 10)
    private String panNumber;
    
    @Column(name = "fraud_type", length = 100)
    private String fraudType; // Identity Theft, Document Forgery, Financial Fraud, etc.
    
    @Enumerated(EnumType.STRING)
    @Column(name = "severity_level", length = 10)
    private SeverityLevel severityLevel;
    
    @Column(name = "source_authority", length = 100)
    private String sourceAuthority; // RBI, SEBI, Police, Bank, etc.
    
    @Column(name = "reported_date")
    private LocalDate reportedDate;
    
    @Column(name = "resolved_flag", nullable = false)
    private Boolean resolvedFlag = false;
    
    @Column(name = "resolution_date")
    private LocalDate resolutionDate;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    // Enum for severity levels
    public enum SeverityLevel {
        LOW, MEDIUM, HIGH
    }
    
    // Business methods
    public boolean isActiveCase() {
        return resolvedFlag == null || !resolvedFlag;
    }
    
    public boolean isHighSeverity() {
        return SeverityLevel.HIGH.equals(severityLevel);
    }
    
    public boolean isRecentCase() {
        if (reportedDate == null) {
            return false;
        }
        return reportedDate.isAfter(LocalDate.now().minusYears(2));
    }
    
    public long getDaysSinceReported() {
        if (reportedDate == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(reportedDate, LocalDate.now());
    }
    
    public long getDaysToResolve() {
        if (reportedDate == null || resolutionDate == null) {
            return 0;
        }
        return java.time.temporal.ChronoUnit.DAYS.between(reportedDate, resolutionDate);
    }
    
    public boolean isFinancialFraud() {
        return fraudType != null && 
               (fraudType.toLowerCase().contains("financial") ||
                fraudType.toLowerCase().contains("loan") ||
                fraudType.toLowerCase().contains("credit") ||
                fraudType.toLowerCase().contains("bank"));
    }
    
    public boolean isIdentityFraud() {
        return fraudType != null && 
               (fraudType.toLowerCase().contains("identity") ||
                fraudType.toLowerCase().contains("document") ||
                fraudType.toLowerCase().contains("forgery"));
    }
}
