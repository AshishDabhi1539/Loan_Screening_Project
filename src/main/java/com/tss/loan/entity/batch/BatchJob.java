package com.tss.loan.entity.batch;

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
@Table(name = "batch_jobs", indexes = {
        @Index(name = "idx_batch_job_type", columnList = "jobType"),
        @Index(name = "idx_batch_job_status", columnList = "status"),
        @Index(name = "idx_batch_job_scheduled", columnList = "scheduledAt"),
        @Index(name = "idx_batch_job_started", columnList = "startedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class BatchJob {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, length = 100)
    private String jobName;
    
    @Column(nullable = false, length = 100)
    private String jobType; // FRAUD_SYNC, CREDIT_UPDATE, REPORT_GENERATION, DATA_CLEANUP
    
    @Column(nullable = false, length = 50)
    private String status; // SCHEDULED, RUNNING, COMPLETED, FAILED, CANCELLED
    
    @Column(columnDefinition = "TEXT")
    private String parameters; // JSON format
    
    @Column(nullable = false)
    private LocalDateTime scheduledAt;
    
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    @Column(nullable = false)
    private Long totalRecords = 0L;
    
    @Column(nullable = false)
    private Long processedRecords = 0L;
    
    @Column(nullable = false)
    private Long successfulRecords = 0L;
    
    @Column(nullable = false)
    private Long failedRecords = 0L;
    
    @Column(columnDefinition = "TEXT")
    private String errorMessage;
    
    @Column(columnDefinition = "TEXT")
    private String executionLog;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triggered_by_id")
    private User triggeredBy;
    
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
    
    public boolean isRunning() {
        return "RUNNING".equals(status);
    }
    
    public boolean isCompleted() {
        return "COMPLETED".equals(status);
    }
    
    public boolean isFailed() {
        return "FAILED".equals(status);
    }
    
    public double getProgressPercentage() {
        if (totalRecords == 0) return 0.0;
        return (processedRecords * 100.0) / totalRecords;
    }
}
