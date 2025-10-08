package com.tss.loan.entity.investigation;

import java.time.LocalDateTime;
import java.util.List;

import com.tss.loan.entity.enums.InvestigationStatus;
import com.tss.loan.entity.enums.RiskLevel;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.RequiredArgsConstructor;

@Entity
@Table(name = "investigation_cases", indexes = {
        @Index(name = "idx_invest_application", columnList = "loan_application_id"),
        @Index(name = "idx_invest_officer", columnList = "assigned_officer_id"),
        @Index(name = "idx_invest_status", columnList = "status"),
        @Index(name = "idx_invest_priority", columnList = "priority"),
        @Index(name = "idx_invest_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class InvestigationCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;
    
    @Column(nullable = false, length = 100)
    private String caseNumber;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvestigationStatus status = InvestigationStatus.PENDING;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel priority = RiskLevel.MEDIUM;
    
    @Column(nullable = false, length = 200)
    private String reason;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(columnDefinition = "TEXT")
    private String findings;
    
    @Column(columnDefinition = "TEXT")
    private String recommendation;
    
    private LocalDateTime assignedAt;
    
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;
    
    private LocalDateTime dueDate;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @OneToMany(mappedBy = "investigationCase", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<InvestigationNote> notes;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (caseNumber == null) {
            caseNumber = "INV-" + System.currentTimeMillis();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public boolean isOverdue() {
        return dueDate != null && dueDate.isBefore(LocalDateTime.now()) && 
               status != InvestigationStatus.COMPLETED && status != InvestigationStatus.CLOSED;
    }
    
    public boolean isActive() {
        return status == InvestigationStatus.IN_PROGRESS || status == InvestigationStatus.PENDING;
    }
}
