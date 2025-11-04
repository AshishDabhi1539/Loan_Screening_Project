package com.tss.loan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.compliance.ComplianceInvestigation;

/**
 * Repository for storing compliance investigation results in the main database
 * This is different from the external ComplianceInvestigationRepository which executes stored procedures
 */
@Repository("complianceInvestigationStorageRepository")
public interface ComplianceInvestigationRepository extends JpaRepository<ComplianceInvestigation, Long> {
    
    /**
     * Find the most recent investigation for an application
     */
    @Query("SELECT ci FROM ComplianceInvestigation ci WHERE ci.loanApplication.id = :applicationId ORDER BY ci.investigatedAt DESC")
    Optional<ComplianceInvestigation> findMostRecentByApplicationId(@Param("applicationId") UUID applicationId);
    
    /**
     * Check if investigation exists for application
     */
    boolean existsByLoanApplicationId(UUID applicationId);
}

