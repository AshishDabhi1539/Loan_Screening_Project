package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for compliance officer to submit their decision (approve/reject)
 * This includes notes that will be sent to the loan officer
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceSubmitDecisionRequest {
    @NotBlank(message = "Decision is required")
    private String decision; // "APPROVE" or "REJECT"
    
    @NotBlank(message = "Notes to loan officer are required")
    private String notesToLoanOfficer; // Notes explaining the decision to the loan officer
}

