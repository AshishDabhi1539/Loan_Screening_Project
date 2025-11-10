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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Entity to store compliance officer document requests
 * This replaces the need to parse from audit logs
 */
@Entity
@Table(name = "compliance_document_requests", indexes = {
        @Index(name = "idx_compliance_req_application", columnList = "loan_application_id"),
        @Index(name = "idx_compliance_req_status", columnList = "status"),
        @Index(name = "idx_compliance_req_officer", columnList = "requested_by_id")
        // Note: idx_compliance_req_created and idx_compliance_req_composite are created by migration V3
})
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ComplianceDocumentRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "loan_application_id", nullable = false)
    private LoanApplication loanApplication;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_by_id", nullable = false)
    private User requestedBy;
    
    /**
     * JSON array of document types as strings
     * Example: ["PAN_CARD", "BANK_STATEMENT", "AADHAAR_CARD"]
     */
    @Column(name = "required_document_types", nullable = false, columnDefinition = "JSON")
    private String requiredDocumentTypes;
    
    @Column(name = "request_reason", nullable = false, columnDefinition = "TEXT")
    private String requestReason;
    
    @Column(name = "additional_instructions", columnDefinition = "TEXT")
    private String additionalInstructions;
    
    @Column(name = "deadline_days", nullable = false)
    private Integer deadlineDays;
    
    @Column(name = "priority_level", length = 20)
    private String priorityLevel; // HIGH, MEDIUM, LOW
    
    @Column(name = "is_mandatory", nullable = false)
    private Boolean isMandatory = true;
    
    @Column(name = "compliance_category", length = 50)
    private String complianceCategory; // KYC, FINANCIAL, IDENTITY, etc.
    
    /**
     * Request status
     * PENDING - Documents not yet uploaded by applicant
     * RECEIVED - Documents uploaded, awaiting compliance review
     * FULFILLED - Compliance officer has reviewed and accepted
     * EXPIRED - Deadline passed without submission
     */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    
    @Column(name = "requested_at", nullable = false, updatable = false, columnDefinition = "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)")
    private LocalDateTime requestedAt;
    
    @Column(name = "fulfilled_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime fulfilledAt;
    
    @Column(name = "updated_at", nullable = false, columnDefinition = "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)")
    private LocalDateTime updatedAt;
    
    @Version
    private Long version;
    
    @PrePersist
    protected void onCreate() {
        if (requestedAt == null) {
            requestedAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = "PENDING";
        }
        if (isMandatory == null) {
            isMandatory = true;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if ("FULFILLED".equals(status) && fulfilledAt == null) {
            fulfilledAt = LocalDateTime.now();
        }
    }
}

