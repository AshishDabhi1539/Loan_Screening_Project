package com.tss.loan.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.financial.ProfessionalEmploymentDetails;

@Repository
public interface ProfessionalEmploymentDetailsRepository extends JpaRepository<ProfessionalEmploymentDetails, Long> {
    
    /**
     * Find professional employment details by financial profile ID
     */
    @Query("SELECT p FROM ProfessionalEmploymentDetails p WHERE p.financialProfile.id = :profileId")
    Optional<ProfessionalEmploymentDetails> findByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Check if professional employment details exist for a financial profile
     */
    @Query("SELECT COUNT(p) > 0 FROM ProfessionalEmploymentDetails p WHERE p.financialProfile.id = :profileId")
    boolean existsByFinancialProfileId(@Param("profileId") Long profileId);
    
    /**
     * Delete professional employment details by financial profile ID
     */
    void deleteByFinancialProfileId(Long profileId);
}
