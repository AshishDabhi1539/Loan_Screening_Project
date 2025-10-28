package com.tss.loan.dto.response;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.DecisionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for loan decision operations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoanDecisionResponse {
    
    private UUID applicationId;
    private UUID decisionMakerId;
    private String decisionMakerName;
    private DecisionType decisionType;
    private ApplicationStatus newStatus;
    private String decisionReason;
    private LocalDateTime decisionTimestamp;
    
    // For approved applications
    private BigDecimal approvedAmount;
    private BigDecimal approvedInterestRate;
    private Integer approvedTenureMonths;
    
    // For rejected applications
    private String rejectionReason;
    
    // Additional information
    private String additionalNotes;
    private Boolean requiresComplianceReview;
    private String nextSteps;
    
    // Workflow information
    private String previousStatus;
    private Boolean canBeAppealed;
    private LocalDateTime appealDeadline;
}
