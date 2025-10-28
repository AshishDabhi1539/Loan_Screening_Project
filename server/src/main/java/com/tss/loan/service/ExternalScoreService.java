package com.tss.loan.service;

import com.tss.loan.dto.request.ExternalScoreRequest;
import com.tss.loan.dto.response.ExternalScoreResponse;

/**
 * External Score Service Interface
 * Handles automated credit and risk score calculations from external database
 */
public interface ExternalScoreService {
    
    /**
     * Calculate credit and risk scores automatically
     * This method performs all operations automatically:
     * 1. Queries all external databases (BankDetails, LoanHistory, FraudRecord)
     * 2. Retrieves previous calculations (if any) for enhanced accuracy
     * 3. Calculates credit score using advanced algorithms
     * 4. Calculates risk score using risk assessment algorithms
     * 5. Stores new calculation results in CreditScoreHistory
     * 6. Returns comprehensive score response
     * 
     * @param request Contains Aadhaar and PAN numbers
     * @return Complete score response with credit score, risk score, and supporting data
     */
    ExternalScoreResponse calculateScores(ExternalScoreRequest request);
}
