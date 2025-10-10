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
}
