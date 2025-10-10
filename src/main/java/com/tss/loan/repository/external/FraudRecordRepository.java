package com.tss.loan.repository.external;

import com.tss.loan.entity.external.FraudRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
@Transactional(transactionManager = "externalTransactionManager")
public interface FraudRecordRepository extends JpaRepository<FraudRecord, UUID> {
    
    /**
     * Find fraud records by Aadhaar number
     */
    List<FraudRecord> findByAadhaarNumber(String aadhaarNumber);
    
    /**
     * Find fraud records by PAN number
     */
    List<FraudRecord> findByPanNumber(String panNumber);
    
    /**
     * Find fraud records by both Aadhaar and PAN
     */
    List<FraudRecord> findByAadhaarNumberOrPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Find active (unresolved) fraud cases
     */
    List<FraudRecord> findByAadhaarNumberAndResolvedFlagFalse(String aadhaarNumber);
    
    /**
     * Find high severity fraud cases
     */
    List<FraudRecord> findByAadhaarNumberAndSeverityLevel(String aadhaarNumber, FraudRecord.SeverityLevel severityLevel);
    
    /**
     * Find recent fraud cases (within specified days)
     */
    @Query("SELECT fr FROM FraudRecord fr WHERE (fr.aadhaarNumber = :aadhaar OR fr.panNumber = :pan) " +
           "AND fr.reportedDate >= :fromDate")
    List<FraudRecord> findRecentFraudCases(@Param("aadhaar") String aadhaarNumber, 
                                          @Param("pan") String panNumber, 
                                          @Param("fromDate") LocalDate fromDate);
    
    /**
     * Check if person has any fraud records
     */
    boolean existsByAadhaarNumberOrPanNumber(String aadhaarNumber, String panNumber);
    
    /**
     * Count active fraud cases
     */
    @Query("SELECT COUNT(fr) FROM FraudRecord fr WHERE (fr.aadhaarNumber = :aadhaar OR fr.panNumber = :pan) " +
           "AND fr.resolvedFlag = false")
    Long countActiveFraudCases(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
    
    /**
     * Find financial fraud cases specifically
     */
    @Query("SELECT fr FROM FraudRecord fr WHERE (fr.aadhaarNumber = :aadhaar OR fr.panNumber = :pan) " +
           "AND (LOWER(fr.fraudType) LIKE '%financial%' OR LOWER(fr.fraudType) LIKE '%loan%' OR LOWER(fr.fraudType) LIKE '%credit%')")
    List<FraudRecord> findFinancialFraudCases(@Param("aadhaar") String aadhaarNumber, @Param("pan") String panNumber);
}
