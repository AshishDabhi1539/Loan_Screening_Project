package com.tss.loan.repository.external;

import com.tss.loan.entity.external.CreditScoreHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@Transactional(transactionManager = "externalTransactionManager")
public interface CreditScoreHistoryRepository extends JpaRepository<CreditScoreHistory, UUID> {
    
    /**
     * Find credit score history by Aadhaar number
     */
    List<CreditScoreHistory> findByAadhaarNumber(String aadhaarNumber);
    
    /**
     * Find credit score history by PAN number
     */
    List<CreditScoreHistory> findByPanNumber(String panNumber);
    
    /**
     * Find credit score history by both Aadhaar and PAN
     */
    List<CreditScoreHistory> findByAadhaarNumberOrPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Find latest credit score for a person
     */
    @Query("SELECT csh FROM CreditScoreHistory csh WHERE (csh.aadhaarNumber = :aadhaar OR csh.panNumber = :pan) " +
           "ORDER BY csh.computedDate DESC")
    List<CreditScoreHistory> findLatestCreditScore(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Find most recent credit score (single record)
     */
    @Query("SELECT csh FROM CreditScoreHistory csh WHERE (csh.aadhaarNumber = :aadhaar OR csh.panNumber = :pan) " +
           "ORDER BY csh.computedDate DESC LIMIT 1")
    Optional<CreditScoreHistory> findMostRecentCreditScore(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Find credit scores within a specific range
     */
    @Query("SELECT csh FROM CreditScoreHistory csh WHERE (csh.aadhaarNumber = :aadhaar OR csh.panNumber = :pan) " +
           "AND csh.creditScore BETWEEN :minScore AND :maxScore")
    List<CreditScoreHistory> findCreditScoresInRange(@Param("aadhaar") String aadhaarNumber, 
                                                     @Param("pan") String panNumber,
                                                     @Param("minScore") Integer minScore, 
                                                     @Param("maxScore") Integer maxScore);
    
    /**
     * Find high-risk credit profiles
     */
    @Query("SELECT csh FROM CreditScoreHistory csh WHERE (csh.aadhaarNumber = :aadhaar OR csh.panNumber = :pan) " +
           "AND (csh.riskScore = 'HIGH' OR csh.totalDefaults > 0 OR csh.fraudCases > 0)")
    List<CreditScoreHistory> findHighRiskProfiles(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Find recent credit score history (within specified days)
     */
    @Query("SELECT csh FROM CreditScoreHistory csh WHERE (csh.aadhaarNumber = :aadhaar OR csh.panNumber = :pan) " +
           "AND csh.computedDate >= :fromDate ORDER BY csh.computedDate DESC")
    List<CreditScoreHistory> findRecentCreditHistory(@Param("aadhaar") String aadhaarNumber, 
                                                     @Param("pan") String panNumber, 
                                                     @Param("fromDate") LocalDateTime fromDate);
    
    /**
     * Check if person has credit history
     */
    boolean existsByAadhaarNumberOrPanNumber(String aadhaarNumber, String panNumber);
}
