package com.tss.loan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.financial.FreelancerEmploymentDetails;

@Repository
public interface FreelancerEmploymentDetailsRepository extends JpaRepository<FreelancerEmploymentDetails, Long> {
    
    /**
     * Find freelancer employment details by financial profile ID
     */
    @Query("SELECT f FROM FreelancerEmploymentDetails f WHERE f.financialProfile.id = :profileId")
    Optional<FreelancerEmploymentDetails> findByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Check if freelancer employment details exist for a financial profile
     */
    @Query("SELECT COUNT(f) > 0 FROM FreelancerEmploymentDetails f WHERE f.financialProfile.id = :profileId")
    boolean existsByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Delete freelancer employment details by financial profile ID
     */
    void deleteByFinancialProfileId(Long profileId);
}
