package com.tss.loan.entity.dashboard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

import com.tss.loan.entity.enums.RoleType;

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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "dashboard_metrics", indexes = {
        @Index(name = "idx_metrics_date_role", columnList = "metricDate,roleType"),
        @Index(name = "idx_metrics_type", columnList = "metricType"),
        @Index(name = "idx_metrics_date", columnList = "metricDate")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class DashboardMetrics {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate metricDate;
    
    @Column(nullable = false, length = 100)
    private String metricType; // APPLICATIONS_SUBMITTED, FRAUD_DETECTED, APPROVALS, REJECTIONS, etc.
    
    @Enumerated(EnumType.STRING)
    private RoleType roleType; // For role-specific metrics
    
    @Column(nullable = false)
    private Long metricValue;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal monetaryValue;
    
    @Column(precision = 5, scale = 2)
    private BigDecimal percentageValue;
    
    @Column(columnDefinition = "TEXT")
    private String additionalData; // JSON format for complex metrics
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
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
