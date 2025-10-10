package com.tss.loan.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * External Score Response DTO
 * Contains calculated credit score and risk assessment from external database
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
     * Risk level assessment
     */
    private String riskScore; // HIGH, MEDIUM, LOW
    
    /**
     * Numeric risk score (0-100 scale)
     */
    private Integer riskScoreNumeric;
    
    /**
     * Red alert flag for extremely high risk (≥90)
     */
    private Boolean redAlertFlag;
    
    /**
     * Timestamp when scores were calculated
     */
    private LocalDateTime calculatedAt;
    
    /**
     * Whether any data was found for the provided Aadhaar/PAN
     */
    private Boolean dataFound;
    
    /**
     * Total outstanding loan amount
     */
    private BigDecimal totalOutstanding;
    
    /**
     * Number of active loans
     */
    private Long activeLoansCount;
    
    /**
     * Number of missed payments
     */
    private Long totalMissedPayments;
    
    /**
     * Whether person has any defaults
     */
    private Boolean hasDefaults;
    
    /**
     * Number of active fraud cases
     */
    private Long activeFraudCases;
    
    /**
     * Additional risk factors found
     */
    private String riskFactors;
    
    /**
     * Credit score explanation/reasoning
     */
    private String creditScoreReason;
}
