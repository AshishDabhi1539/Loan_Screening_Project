package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for flagging application for compliance review
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceFlagRequest {
    
    @NotBlank(message = "Flag reason is required")
    @Size(max = 500, message = "Flag reason cannot exceed 500 characters")
    private String flagReason;
    
    @Size(max = 1000, message = "Additional details cannot exceed 1000 characters")
    private String additionalDetails;
    
    // Specific concerns or red flags identified
    private List<String> concernsIdentified;
    
    // Priority level for compliance review
    private String priorityLevel = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT
    
    // Recommended actions for compliance officer
    @Size(max = 500, message = "Recommended actions cannot exceed 500 characters")
    private String recommendedActions;
}
