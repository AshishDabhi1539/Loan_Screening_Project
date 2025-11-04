package com.tss.loan.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for compliance officer to trigger decision process
 * This moves the application to AWAITING_COMPLIANCE_DECISION status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceTriggerDecisionRequest {
    @NotBlank(message = "Summary notes are required")
    private String summaryNotes; // Brief summary of investigation findings
}

