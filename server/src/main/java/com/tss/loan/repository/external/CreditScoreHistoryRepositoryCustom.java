package com.tss.loan.repository.external;

/**
 * Custom repository interface for CreditScoreHistory
 */
public interface CreditScoreHistoryRepositoryCustom {
    
    /**
     * Execute stored procedure and get results in one transaction
     */
    Object[] executeCalculateExternalScores(String aadhaarNumber, String panNumber);
}
