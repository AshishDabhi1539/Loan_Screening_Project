package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for loan officer to acknowledge compliance review
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AcknowledgeComplianceReviewRequest {
    
    @NotNull(message = "Acknowledgment is required")
    private Boolean acknowledged;
    
    private String loanOfficerNotes; // Optional notes from loan officer
}
