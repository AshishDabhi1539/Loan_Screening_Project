package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDecisionRequest {
    
    @NotNull(message = "Decision type is required")
    private ComplianceDecisionType decisionType;
    
    @NotBlank(message = "Decision notes are required")
    private String decisionNotes;
    
    private String additionalNotes;
    
    private String complianceViolationType;
    
    private String recommendedAction;
    
    private boolean requiresRegulatoryReporting;
    
    private String escalationReason; // For escalation requests
    
    public enum ComplianceDecisionType {
        CLEARED,           // No compliance issues found
        REJECTED,          // Compliance violation found
        ESCALATE,          // Escalate to senior officer
        REQUEST_DOCUMENTS  // Need additional documents
    }
}
