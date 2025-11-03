package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Enhanced response for external verification completion with credit scoring details
 * Includes all data from CalculateExternalScores stored procedure
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalVerificationResponse {
    
    // Application Status
    private String message;
    private UUID applicationId;
    private String previousStatus;
    private String newStatus;
    private LocalDateTime completedAt;
    
    // Credit Scoring Results (from stored procedure)
    private Integer creditScore;
    private String riskType;              // LOW, MEDIUM, HIGH, INVALID, UNKNOWN
    private Integer riskScoreNumeric;     // 0-100 numeric risk score
    private String riskFactors;           // Detailed risk factors explanation
    private String creditScoreReason;     // Explanation for credit score
    private Boolean redAlertFlag;         // Critical risk indicator
    
    // Financial Metrics (from stored procedure)
    private BigDecimal totalOutstanding;  // Total outstanding loan amount
    private Integer activeLoansCount;     // Number of active loans
    private Integer totalMissedPayments;  // Total missed payments
    private Boolean hasDefaults;          // Loan default history flag
    private Integer activeFraudCases;     // Active fraud cases count
    
    // Data Availability
    private Boolean dataFound;            // Whether external data was found
    
    // Next Steps
    private String nextSteps;
    private Boolean readyForDecision;
    
    // Banking Recommendation
    private String recommendedAction;     // Recommended action based on scoring
}
