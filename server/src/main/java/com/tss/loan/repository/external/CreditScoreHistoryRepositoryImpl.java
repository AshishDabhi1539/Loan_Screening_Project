package com.tss.loan.repository.external;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Custom repository implementation for CreditScoreHistory
 */
@Repository
@Slf4j
public class CreditScoreHistoryRepositoryImpl implements CreditScoreHistoryRepositoryCustom {

    @PersistenceContext(unitName = "external")
    private EntityManager entityManager;

    @Override
    @Transactional(transactionManager = "externalTransactionManager")
    public Object[] executeCalculateExternalScores(String aadhaarNumber, String panNumber) {
        try {
            log.info("Executing stored procedure for Aadhaar: {} and PAN: {}", aadhaarNumber, panNumber);
            
            // Step 1: Call the stored procedure
            Query callQuery = entityManager.createNativeQuery(
                "CALL CalculateExternalScores(?, ?, @credit_score, @risk_score, @risk_score_numeric, @red_alert_flag, " +
                "@total_outstanding, @active_loans_count, @total_missed_payments, @has_defaults, @active_fraud_cases, " +
                "@risk_factors, @credit_score_reason, @data_found)"
            );
            callQuery.setParameter(1, aadhaarNumber);
            callQuery.setParameter(2, panNumber);
            callQuery.executeUpdate();
            
            log.info("Stored procedure called successfully, retrieving results...");
            
            // Step 2: Get the results from session variables
            Query resultQuery = entityManager.createNativeQuery(
                "SELECT @credit_score, @risk_score, @risk_score_numeric, @red_alert_flag, " +
                "@total_outstanding, @active_loans_count, @total_missed_payments, @has_defaults, " +
                "@active_fraud_cases, @risk_factors, @credit_score_reason, @data_found"
            );
            
            @SuppressWarnings("unchecked")
            List<Object> resultList = resultQuery.getResultList();
            
            if (resultList.isEmpty()) {
                log.warn("No results returned from stored procedure variables");
                return new Object[0];
            }
            
            Object result = resultList.get(0);
            if (result instanceof Object[]) {
                Object[] resultArray = (Object[]) result;
                log.info("Retrieved {} result values from stored procedure", resultArray.length);
                return resultArray;
            } else {
                log.warn("Unexpected result type: {}", result.getClass());
                return new Object[]{result};
            }
            
        } catch (Exception e) {
            log.error("Error executing stored procedure for Aadhaar: {} and PAN: {}", aadhaarNumber, panNumber, e);
            throw new RuntimeException("Failed to execute stored procedure", e);
        }
    }
}
