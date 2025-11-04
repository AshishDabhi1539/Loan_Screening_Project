package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for risk assessment summary in compliance review
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RiskAssessmentSummaryDTO {
    private String overallRisk; // LOW, MEDIUM, HIGH
    private String fraudIndicators;
    private Integer documentsVerified;
    private Integer totalDocuments;
    private String externalChecksStatus; // PASSED, FAILED, PENDING
    private Integer riskScore;
    private String riskLevel;
}
