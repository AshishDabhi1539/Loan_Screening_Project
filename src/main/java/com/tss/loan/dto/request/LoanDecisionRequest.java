package com.tss.loan.dto.request;

import com.tss.loan.entity.enums.DecisionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for loan application decision (approve/reject)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoanDecisionRequest {
    
    @NotNull(message = "Decision type is required")
    private DecisionType decisionType;
    
    @Size(max = 1000, message = "Decision reason cannot exceed 1000 characters")
    private String decisionReason;
    
    // For approval decisions
    private BigDecimal approvedAmount;
    private BigDecimal approvedInterestRate;
    private Integer approvedTenureMonths;
    
    // For rejection decisions
    @Size(max = 500, message = "Rejection reason cannot exceed 500 characters")
    private String rejectionReason;
    
    // Additional conditions or notes
    @Size(max = 1000, message = "Additional notes cannot exceed 1000 characters")
    private String additionalNotes;
    
    // Flag for compliance review requirement
    private Boolean requiresComplianceReview = false;
}
