package com.tss.loan.repository.external;

import com.tss.loan.entity.external.LoanHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
@Transactional(transactionManager = "externalTransactionManager")
public interface LoanHistoryRepository extends JpaRepository<LoanHistory, UUID> {
    
    /**
     * Find loan history by Aadhaar number
     */
    List<LoanHistory> findByAadhaarNumber(String aadhaarNumber);
    
    /**
     * Find loan history by PAN number
     */
    List<LoanHistory> findByPanNumber(String panNumber);
    
    /**
     * Find loan history by both Aadhaar and PAN
     */
    List<LoanHistory> findByAadhaarNumberAndPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Find active loans only
     */
    List<LoanHistory> findByAadhaarNumberAndLoanStatus(String aadhaarNumber, String loanStatus);
    
    /**
     * Find defaulted loans
     */
    List<LoanHistory> findByAadhaarNumberAndDefaultFlagTrue(String aadhaarNumber);
    
    /**
     * Find high-risk loans (with defaults or high missed payments)
     */
    @Query("SELECT lh FROM LoanHistory lh WHERE (lh.aadhaarNumber = :aadhaar OR lh.panNumber = :pan) " +
           "AND (lh.defaultFlag = true OR lh.missedPayments > :maxMissed)")
    List<LoanHistory> findHighRiskLoans(@Param("aadhaar") String aadhaarNumber, 
                                       @Param("pan") String panNumber, 
                                       @Param("maxMissed") Integer maxMissedPayments);
    
    /**
     * Get total outstanding amount for a person
     */
    @Query("SELECT COALESCE(SUM(lh.currentOutstanding), 0) FROM LoanHistory lh " +
           "WHERE (lh.aadhaarNumber = :aadhaar OR lh.panNumber = :pan) AND lh.loanStatus = 'Active'")
    BigDecimal getTotalOutstandingAmount(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Count active loans
     */
    @Query("SELECT COUNT(lh) FROM LoanHistory lh " +
           "WHERE (lh.aadhaarNumber = :aadhaar OR lh.panNumber = :pan) AND lh.loanStatus = 'Active'")
    Long countActiveLoans(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Get total missed payments count for credit scoring
     */
    @Query("SELECT COALESCE(SUM(lh.missedPayments), 0) FROM LoanHistory lh " +
           "WHERE (lh.aadhaarNumber = :aadhaar OR lh.panNumber = :pan)")
    Long getTotalMissedPayments(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Check if person has any defaults (for risk assessment)
     */
    boolean existsByAadhaarNumberOrPanNumberAndDefaultFlagTrue(String aadhaarNumber, String panNumber);
    
    /**
     * Get all loan metrics in single optimized query for maximum speed
     */
    @Query(value = """
        SELECT 
            COALESCE(SUM(current_outstanding), 0) as totalOutstanding,
            COUNT(CASE WHEN loan_status = 'Active' THEN 1 END) as activeLoans,
            COALESCE(SUM(missed_payments), 0) as totalMissedPayments,
            CASE WHEN COUNT(CASE WHEN default_flag = true THEN 1 END) > 0 THEN 1 ELSE 0 END as hasDefaults,
            COUNT(*) as totalLoans
        FROM loan_history 
        WHERE aadhaar_number = :aadhaar OR pan_number = :pan
        """, nativeQuery = true)
    Object[] getLoanMetricsFast(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
}
