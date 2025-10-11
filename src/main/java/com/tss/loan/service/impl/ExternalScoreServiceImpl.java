package com.tss.loan.service.impl;

import com.tss.loan.dto.request.ExternalScoreRequest;
import com.tss.loan.dto.response.ExternalScoreResponse;
import com.tss.loan.entity.external.CreditScoreHistory;
import com.tss.loan.repository.external.CreditScoreHistoryRepository;
import com.tss.loan.service.ExternalScoreService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * External Score Service Implementation
 * Performs fully automated credit and risk score calculations
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(transactionManager = "externalTransactionManager")
public class ExternalScoreServiceImpl implements ExternalScoreService {
    
    private final CreditScoreHistoryRepository creditScoreHistoryRepository;
    
    @Override
    public ExternalScoreResponse calculateScores(ExternalScoreRequest request) {
        log.info("Starting stored procedure score calculation for Aadhaar: {} and PAN: {}", 
                 request.getAadhaarNumber(), request.getPanNumber());
        
        String aadhaar = request.getAadhaarNumber();
        String pan = request.getPanNumber();
        LocalDateTime calculatedAt = LocalDateTime.now();
        
        try {
            // Execute stored procedure using custom repository implementation
            log.info("Executing stored procedure for Aadhaar: {} and PAN: {}", aadhaar, pan);
            
            Object[] result = creditScoreHistoryRepository.executeCalculateExternalScores(aadhaar, pan);
            
            if (result == null || result.length == 0) {
                log.warn("Stored procedure returned no results for Aadhaar: {} and PAN: {}", aadhaar, pan);
                return buildNoDataResponse(calculatedAt);
            }
            
            log.info("Stored procedure executed successfully. Result array length: {}", result.length);
            
            // Parse stored procedure results - only required fields
            Integer creditScore = result[0] != null ? ((Number) result[0]).intValue() : null;
            String riskScore = result[1] != null ? result[1].toString() : "UNKNOWN";
            Integer riskScoreNumeric = result[2] != null ? ((Number) result[2]).intValue() : 0;
            Boolean redAlertFlag = result[3] != null ? ((Number) result[3]).intValue() == 1 : false;
            // Skip indices 4-8 (totalOutstanding, activeLoansCount, totalMissedPayments, hasDefaults, activeFraudCases)
            Boolean hasDefaults = result[7] != null ? ((Number) result[7]).intValue() == 1 : false;
            Long activeFraudCases = result[8] != null ? ((Number) result[8]).longValue() : 0L;
            String riskFactors = result[9] != null ? result[9].toString() : "No risk factors identified";
            String creditScoreReason = result[10] != null ? result[10].toString() : "Based on available data";
            Boolean dataFound = result[11] != null ? ((Number) result[11]).intValue() == 1 : false;
            
            // Handle different response scenarios
            if ("INVALID".equals(riskScore)) {
                // Identity mismatch detected
                log.error("Identity mismatch detected for Aadhaar: {} and PAN: {}. Risk Score: INVALID", aadhaar, pan);
            } else if (dataFound && creditScore != null) {
                // Valid data found - save to history
                saveCalculationHistory(aadhaar, pan, creditScore, riskScore, hasDefaults, 
                                     activeFraudCases, calculatedAt);
                
                log.info("Score calculation completed. Credit Score: {}, Risk Score: {}, Numeric Risk: {}, Red Alert: {}", 
                         creditScore, riskScore, riskScoreNumeric, redAlertFlag);
            } else {
                log.warn("No external data found for Aadhaar: {} and PAN: {}", aadhaar, pan);
            }
            
            // Build response with only required fields
            return ExternalScoreResponse.builder()
                    .creditScore(creditScore)
                    .riskScore(riskScore)
                    .riskScoreNumeric(riskScoreNumeric)
                    .redAlertFlag(redAlertFlag)
                    .riskFactors(riskFactors)
                    .creditScoreReason(creditScoreReason)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error executing stored procedure for Aadhaar: {} and PAN: {}. Error: {}", 
                     aadhaar, pan, e.getMessage(), e);
            
            // Return error response with red alert for system errors
            return ExternalScoreResponse.builder()
                    .creditScore(null)
                    .riskScore("ERROR")
                    .riskScoreNumeric(100)
                    .redAlertFlag(true)
                    .riskFactors("System error occurred during score calculation: " + e.getMessage())
                    .creditScoreReason("Unable to calculate due to system error")
                    .build();
        }
    }
    
    /**
     * Save calculation history using direct values
     */
    private void saveCalculationHistory(String aadhaar, String pan, Integer creditScore, String riskScore,
                                      boolean hasDefaults, Long activeFraudCases, LocalDateTime calculatedAt) {
        CreditScoreHistory history = new CreditScoreHistory();
        history.setAadhaarNumber(aadhaar);
        history.setPanNumber(pan);
        history.setCreditScore(creditScore);
        
        // Convert string risk score to enum
        try {
            history.setRiskScore(CreditScoreHistory.RiskScore.valueOf(riskScore));
        } catch (IllegalArgumentException e) {
            history.setRiskScore(CreditScoreHistory.RiskScore.MEDIUM); // Default fallback
        }
        
        history.setComputedDate(calculatedAt);
        history.setTotalDefaults(hasDefaults ? 1 : 0);
        history.setFraudCases(activeFraudCases != null ? activeFraudCases.intValue() : 0);
        
        creditScoreHistoryRepository.save(history);
    }
    
    /**
     * Build response when no data is found
     */
    private ExternalScoreResponse buildNoDataResponse(LocalDateTime calculatedAt) {
        return ExternalScoreResponse.builder()
                .creditScore(null)
                .riskScore("UNKNOWN")
                .riskScoreNumeric(0)
                .redAlertFlag(false)
                .riskFactors("No external data available for assessment")
                .creditScoreReason("Insufficient data for credit score calculation")
                .build();
    }
}
