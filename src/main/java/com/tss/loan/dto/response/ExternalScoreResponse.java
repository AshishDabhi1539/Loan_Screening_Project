package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External Score Response DTO
 * Contains only essential credit score and risk assessment information
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExternalScoreResponse {
    
    /**
     * Calculated credit score (300-850 range)
     */
    private Integer creditScore;
    
    /**
     * Risk level assessment (HIGH, MEDIUM, LOW)
     */
    private String riskScore;
    
    /**
     * Numeric risk score (0-100 scale)
     */
    private Integer riskScoreNumeric;
    
    /**
     * Red alert flag for extremely high risk (≥90)
     */
    private Boolean redAlertFlag;
    
    /**
     * Additional risk factors found
     */
    private String riskFactors;
    
    /**
     * Credit score explanation/reasoning
     */
    private String creditScoreReason;
}
