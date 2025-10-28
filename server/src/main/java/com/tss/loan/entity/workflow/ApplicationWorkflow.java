package com.tss.loan.entity.workflow;

import java.time.LocalDateTime;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.DecisionType;
import com.tss.loan.entity.loan.LoanApplication;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "application_workflow", indexes = {
        @Index(name = "idx_workflow_application", columnList = "loan_application_id"),
        @Index(name = "idx_workflow_status", columnList = "fromStatus,toStatus"),
        @Index(name = "idx_workflow_user", columnList = "processed_by_id"),
        @Index(name = "idx_workflow_timestamp", columnList = "processedAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class ApplicationWorkflow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ApplicationStatus fromStatus;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ApplicationStatus toStatus;
    
    @Enumerated(EnumType.STRING)
    private DecisionType decisionType;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_id")
    private User processedBy;
    
    @Column(columnDefinition = "TEXT")
    private String comments;
    
    @Column(columnDefinition = "TEXT")
    private String systemRemarks;
    
    @Column(nullable = false)
    private Boolean isSystemGenerated = false;
    
    @Column(nullable = false)
    private LocalDateTime processedAt;
    
    @Column(length = 45)
    private String ipAddress;
    
    @Column(length = 500)
    private String userAgent;
    
    @PrePersist
    protected void onCreate() {
        if (processedAt == null) {
            processedAt = LocalDateTime.now();
        }
    }
}
