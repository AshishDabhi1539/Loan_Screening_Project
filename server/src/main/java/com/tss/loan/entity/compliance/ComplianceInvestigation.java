package com.tss.loan.entity.compliance;

import java.time.LocalDateTime;

import com.tss.loan.entity.loan.LoanApplication;
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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity to store compliance investigation results from stored procedure
 * This allows investigation data to be sent to loan officers when compliance submits decision
 */
@Entity
@Table(name = "compliance_investigations", indexes = {
    @Index(name = "idx_compliance_inv_application", columnList = "loan_application_id"),
    @Index(name = "idx_compliance_inv_officer", columnList = "investigated_by_id"),
    @Index(name = "idx_compliance_inv_date", columnList = "investigated_at")
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ComplianceInvestigation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "investigated_by_id", nullable = false)
    private User investigatedBy;
    
    /**
     * Investigation ID from stored procedure response
     */
    @Column(name = "investigation_id", length = 100)
    private String investigationId;
    
    /**
     * Full JSON response from stored procedure stored as TEXT
     * Contains all investigation data: applicantProfile, overallAssessment, 
     * bank_details, fraud_records, loan_history, consolidatedFindings
     */
    @Column(name = "investigation_data", nullable = false, columnDefinition = "LONGTEXT")
    private String investigationData;
    
    /**
     * Investigation date from stored procedure
     */
    @Column(name = "investigation_date")
    private LocalDateTime investigationDate;
    
    /**
     * Timestamp when investigation was performed
     */
    @Column(name = "investigated_at", nullable = false, updatable = false)
    private LocalDateTime investigatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (investigatedAt == null) {
            investigatedAt = LocalDateTime.now();
        }
    }
}

