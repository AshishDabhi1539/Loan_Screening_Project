package com.tss.loan.entity.loan;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.LoanType;
import com.tss.loan.entity.enums.RiskLevel;
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
@Table(name = "loan_applications", indexes = {
        @Index(name = "idx_loan_app_applicant", columnList = "applicant_id"),
        @Index(name = "idx_loan_app_status", columnList = "status"),
        @Index(name = "idx_loan_app_type", columnList = "loanType"),
        @Index(name = "idx_loan_app_risk", columnList = "riskLevel"),
        @Index(name = "idx_loan_app_created", columnList = "createdAt")
})
@RequiredArgsConstructor
@AllArgsConstructor
@Data
public class LoanApplication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;
    
    @Column(nullable = false, length = 100)
    private String applicantName;
    
    @Column(nullable = false, length = 150)
    private String applicantEmail;
    
    @Column(nullable = false, length = 15)
    private String applicantPhone;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LoanType loanType;
    
    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal requestedAmount;
    
    @Column(nullable = false)
    private Integer tenureMonths;
    
    @Column(columnDefinition = "TEXT")
    private String purpose;
    
    @Column(nullable = false)
    private Boolean existingLoans = false;
    
    @Column(precision = 15, scale = 2)
    private BigDecimal existingEmi = BigDecimal.ZERO;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.SUBMITTED;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RiskLevel riskLevel = RiskLevel.LOW;
    
    @Column(nullable = false)
    private LocalDateTime submittedAt;
    
    private LocalDateTime reviewedAt;
    
    private LocalDateTime finalDecisionAt;
    
    @Column(columnDefinition = "TEXT")
    private String remarks;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compliance_officer_id")
    private User complianceOfficer;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @OneToMany(mappedBy = "loanApplication", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LoanDocument> documents;
    
    @OneToMany(mappedBy = "loanApplication", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<com.tss.loan.entity.financial.ApplicantFinancials> financials;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
