package com.tss.loan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.financial.RetiredEmploymentDetails;

@Repository
public interface RetiredEmploymentDetailsRepository extends JpaRepository<RetiredEmploymentDetails, Long> {
    
    /**
     * Find retired employment details by financial profile ID
     */
    @Query("SELECT r FROM RetiredEmploymentDetails r WHERE r.financialProfile.id = :profileId")
    Optional<RetiredEmploymentDetails> findByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Check if retired employment details exist for a financial profile
     */
    @Query("SELECT COUNT(r) > 0 FROM RetiredEmploymentDetails r WHERE r.financialProfile.id = :profileId")
    boolean existsByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Delete retired employment details by financial profile ID
     */
    void deleteByFinancialProfileId(Long profileId);
}
