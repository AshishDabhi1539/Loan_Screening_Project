package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Enhanced response for external verification completion with credit scoring details
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalVerificationResponse {
    
    private String message;
    private UUID applicationId;
    private String previousStatus;
    private String newStatus;
    private LocalDateTime completedAt;
    
    // Credit Scoring Results
    private Integer creditScore;
    private String riskScore;
    private Integer riskScoreNumeric;
    private String riskFactors;
    private String creditScoreReason;
    private Boolean redAlertFlag;
    
    // Next Steps
    private String nextSteps;
    private Boolean readyForDecision;
    
    // Banking Recommendation
    private String recommendedAction;
}
