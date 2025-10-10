package com.tss.loan.repository.external;

import com.tss.loan.entity.external.BankDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional(transactionManager = "externalTransactionManager")
public interface BankDetailsRepository extends JpaRepository<BankDetails, UUID> {
    
    /**
     * Find bank details by Aadhaar number
     */
    List<BankDetails> findByAadhaarNumber(String aadhaarNumber);
    
    /**
     * Find bank details by PAN number
     */
    List<BankDetails> findByPanNumber(String panNumber);
    
    /**
     * Find bank details by both Aadhaar and PAN
     */
    List<BankDetails> findByAadhaarNumberAndPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Find bank details by account number
     */
    Optional<BankDetails> findByAccountNumber(String accountNumber);
    
    /**
     * Find high-risk accounts (with overdraft usage or high cheque bounces)
     */
    @Query("SELECT bd FROM BankDetails bd WHERE bd.overdraftUsed = true OR bd.chequeBounceCount > :maxBounces")
    List<BankDetails> findHighRiskAccounts(@Param("maxBounces") Integer maxBounces);
    
    /**
     * Find salary accounts for income verification
     */
    List<BankDetails> findBySalaryAccountFlagTrue();
    
    /**
     * Check if person exists in banking system
     */
    boolean existsByAadhaarNumberOrPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Get average account balance for credit scoring
     */
    @Query("SELECT AVG(bd.averageMonthlyBalance) FROM BankDetails bd " +
           "WHERE (bd.aadhaarNumber = :aadhaar OR bd.panNumber = :pan)")
    Double getAverageAccountBalance(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Count total cheque bounces for risk assessment
     */
    @Query("SELECT COALESCE(SUM(bd.chequeBounceCount), 0) FROM BankDetails bd " +
           "WHERE (bd.aadhaarNumber = :aadhaar OR bd.panNumber = :pan)")
    Long getTotalChequeBounces(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Check if person has salary account (positive indicator)
     */
    boolean existsByAadhaarNumberOrPanNumberAndSalaryAccountFlagTrue(String aadhaarNumber, String panNumber);
    
    /**
     * Get all bank metrics in single optimized query for maximum speed
     */
    @Query(value = """
        SELECT 
            COALESCE(AVG(average_monthly_balance), 0) as avgBalance,
            COALESCE(SUM(cheque_bounce_count), 0) as totalBounces,
            CASE WHEN COUNT(CASE WHEN salary_account_flag = true THEN 1 END) > 0 THEN 1 ELSE 0 END as hasSalaryAccount,
            COUNT(*) as totalAccounts
        FROM bank_details 
        WHERE aadhaar_number = :aadhaar OR pan_number = :pan
        """, nativeQuery = true)
    Object[] getBankMetricsFast(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
}
