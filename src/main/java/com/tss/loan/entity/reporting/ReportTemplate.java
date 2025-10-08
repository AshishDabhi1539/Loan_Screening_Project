package com.tss.loan.entity.reporting;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.RoleType;
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
@Table(name = "report_templates", indexes = {
        @Index(name = "idx_report_name", columnList = "reportName"),
        @Index(name = "idx_report_category", columnList = "category"),
        @Index(name = "idx_report_role", columnList = "accessibleToRole"),
        @Index(name = "idx_report_active", columnList = "isActive")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ReportTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 200)
    private String reportName;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false, length = 100)
    private String category; // FRAUD_ANALYSIS, LOAN_PERFORMANCE, COMPLIANCE, OPERATIONAL
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String sqlQuery;
    
    @Column(columnDefinition = "TEXT")
    private String parameters; // JSON format for dynamic parameters
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleType accessibleToRole;
    
    @Column(nullable = false, length = 50)
    private String outputFormat; // PDF, EXCEL, CSV, JSON
    
    @Column(nullable = false)
    private Boolean isActive = true;
    
    @Column(nullable = false)
    private Boolean isSchedulable = false;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;
    
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
}
