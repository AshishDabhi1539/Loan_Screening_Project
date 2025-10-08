package com.tss.loan.entity.reporting;

import java.time.LocalDateTime;

import com.tss.loan.entity.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "report_executions", indexes = {
        @Index(name = "idx_report_exec_template", columnList = "report_template_id"),
        @Index(name = "idx_report_exec_user", columnList = "executed_by_id"),
        @Index(name = "idx_report_exec_status", columnList = "status"),
        @Index(name = "idx_report_exec_time", columnList = "executedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ReportExecution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_template_id", nullable = false)
    private ReportTemplate reportTemplate;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "executed_by_id", nullable = false)
    private User executedBy;
    
    @Column(nullable = false, length = 50)
    private String status; // PENDING, RUNNING, COMPLETED, FAILED
    
    @Column(columnDefinition = "TEXT")
    private String parameters; // JSON format for execution parameters
    
    @Column(length = 500)
    private String outputFilePath;
    
    @Column(nullable = false)
    private LocalDateTime executedAt;
    
    private LocalDateTime completedAt;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(nullable = false)
    private Long recordCount = 0L;
    
    @Column(nullable = false)
    private Long executionTimeMs = 0L;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (executedAt == null) {
            executedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
    
    public boolean isFailed() {
        return "FAILED".equals(status);
    }
    
    public void markAsCompleted() {
        this.status = "COMPLETED";
        this.completedAt = LocalDateTime.now();
        this.executionTimeMs = java.time.Duration.between(executedAt, completedAt).toMillis();
    }
}
