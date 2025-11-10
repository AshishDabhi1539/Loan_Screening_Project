package com.tss.loan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.financial.StudentEmploymentDetails;

@Repository
public interface StudentEmploymentDetailsRepository extends JpaRepository<StudentEmploymentDetails, Long> {
    
    /**
     * Find student employment details by financial profile ID
     */
    @Query("SELECT s FROM StudentEmploymentDetails s WHERE s.financialProfile.id = :profileId")
    Optional<StudentEmploymentDetails> findByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Check if student employment details exist for a financial profile
     */
    @Query("SELECT COUNT(s) > 0 FROM StudentEmploymentDetails s WHERE s.financialProfile.id = :profileId")
    boolean existsByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Delete student employment details by financial profile ID
     */
    void deleteByFinancialProfileId(Long profileId);
}
