package com.tss.loan.repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.Priority;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, UUID> {
    
    List<LoanApplication> findByApplicantIdOrderByCreatedAtDesc(UUID applicantId);
    
    List<LoanApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);
    
    List<LoanApplication> findByAssignedOfficerIdOrderByCreatedAtDesc(UUID officerId);
    
    @Query("SELECT la FROM LoanApplication la WHERE la.applicant.id = :applicantId")
    List<LoanApplication> findByApplicantIdWithDetails(@Param("applicantId") UUID applicantId);
    
    long countByStatus(ApplicationStatus status);
    
    long countByStatusIn(List<ApplicationStatus> statuses);
    
    long countByApplicantId(UUID applicantId);
    
    // Methods needed for compliance officer assignment service
    int countByAssignedComplianceOfficerAndStatusIn(User assignedComplianceOfficer, List<ApplicationStatus> statuses);
    
    List<LoanApplication> findByAssignedOfficerOrderByCreatedAtDesc(User assignedOfficer);
    
    List<LoanApplication> findByAssignedComplianceOfficerOrderByCreatedAtDesc(User assignedComplianceOfficer);
    
    List<LoanApplication> findByAssignedComplianceOfficerAndStatus(User assignedComplianceOfficer, ApplicationStatus status);
    
    // ========== LOAN OFFICER DASHBOARD OPTIMIZATION METHODS ==========
    
    // Count methods for dashboard statistics
    long countByAssignedOfficer(User assignedOfficer);
    
    long countByAssignedOfficerAndStatus(User assignedOfficer, ApplicationStatus status);
    
    @Query("SELECT COUNT(la) FROM LoanApplication la WHERE la.assignedOfficer = :officer AND la.status IN :statuses")
    long countByAssignedOfficerAndStatusIn(@Param("officer") User assignedOfficer, @Param("statuses") List<ApplicationStatus> statuses);
    
    long countByAssignedOfficerAndPriority(User assignedOfficer, Priority priority);
    
    @Query("SELECT COUNT(la) FROM LoanApplication la WHERE la.assignedOfficer = :officer AND la.status IN :statuses AND la.updatedAt > :date")
    long countByAssignedOfficerAndStatusInAndUpdatedAtAfter(
        @Param("officer") User assignedOfficer, 
        @Param("statuses") List<ApplicationStatus> statuses, 
        @Param("date") LocalDateTime date);
    
    @Query("SELECT COUNT(la) FROM LoanApplication la WHERE la.assignedOfficer = :officer AND la.requestedAmount > :amount")
    long countByAssignedOfficerAndRequestedAmountGreaterThan(
        @Param("officer") User assignedOfficer, 
        @Param("amount") BigDecimal amount);
    
    @Query("SELECT COUNT(la) FROM LoanApplication la WHERE la.assignedOfficer = :officer AND la.requestedAmount > :amount AND la.status = :status")
    long countByAssignedOfficerAndRequestedAmountGreaterThanAndStatus(
        @Param("officer") User assignedOfficer, 
        @Param("amount") BigDecimal amount,
        @Param("status") ApplicationStatus status);
    
    // Filtered query methods
    List<LoanApplication> findByAssignedOfficerAndStatusOrderByCreatedAtDesc(
        User assignedOfficer, ApplicationStatus status);
    
    // ========== COMPLIANCE OFFICER DASHBOARD OPTIMIZATION METHODS ==========
    
    // Count methods for compliance dashboard statistics
    long countByAssignedComplianceOfficer(User assignedComplianceOfficer);
    
    long countByAssignedComplianceOfficerAndStatus(User assignedComplianceOfficer, ApplicationStatus status);
    
    long countByAssignedComplianceOfficerAndPriority(User assignedComplianceOfficer, Priority priority);
    
    @Query("SELECT COUNT(la) FROM LoanApplication la WHERE la.assignedComplianceOfficer = :officer AND la.status IN :statuses AND la.updatedAt > :date")
    long countByAssignedComplianceOfficerAndStatusInAndUpdatedAtAfter(
        @Param("officer") User assignedComplianceOfficer, 
        @Param("statuses") List<ApplicationStatus> statuses, 
        @Param("date") LocalDateTime date);
    
    // ========== JOIN FETCH QUERIES TO ELIMINATE N+1 ==========
    
    /**
     * Get applications with all required relationships eagerly loaded for loan officer
     * Use this for list operations to avoid N+1 queries
     */
    @Query("SELECT DISTINCT la FROM LoanApplication la " +
           "LEFT JOIN FETCH la.applicant " +
           "LEFT JOIN FETCH la.assignedOfficer " +
           "LEFT JOIN FETCH la.decidedBy " +
           "LEFT JOIN FETCH la.financialProfile " +
           "WHERE la.assignedOfficer = :officer " +
           "ORDER BY la.createdAt DESC")
    List<LoanApplication> findByAssignedOfficerWithDetailsOrderByCreatedAtDesc(@Param("officer") User officer);
    
    /**
     * Get applications for compliance officer with eager loading
     */
    @Query("SELECT DISTINCT la FROM LoanApplication la " +
           "LEFT JOIN FETCH la.applicant " +
           "LEFT JOIN FETCH la.assignedComplianceOfficer " +
           "LEFT JOIN FETCH la.assignedOfficer " +
           "WHERE la.assignedComplianceOfficer = :officer " +
           "ORDER BY la.createdAt DESC")
    List<LoanApplication> findByAssignedComplianceOfficerWithDetailsOrderByCreatedAtDesc(@Param("officer") User officer);
    
    /**
     * Get applicant's applications with eager loading
     */
    @Query("SELECT DISTINCT la FROM LoanApplication la " +
           "LEFT JOIN FETCH la.applicant " +
           "LEFT JOIN FETCH la.assignedOfficer " +
           "LEFT JOIN FETCH la.financialProfile " +
           "WHERE la.applicant.id = :applicantId " +
           "ORDER BY la.createdAt DESC")
    List<LoanApplication> findByApplicantIdWithDetailsOrderByCreatedAtDesc(@Param("applicantId") UUID applicantId);
    
    /**
     * Get single application with ALL relationships for complete details view
     */
    @Query("SELECT la FROM LoanApplication la " +
           "LEFT JOIN FETCH la.applicant " +
           "LEFT JOIN FETCH la.assignedOfficer " +
           "LEFT JOIN FETCH la.decidedBy " +
           "LEFT JOIN FETCH la.assignedComplianceOfficer " +
           "LEFT JOIN FETCH la.complianceReviewAcknowledgedBy " +
           "LEFT JOIN FETCH la.financialProfile " +
           "WHERE la.id = :id")
    Optional<LoanApplication> findByIdWithAllDetails(@Param("id") UUID id);
    
    /**
     * Get application with documents eagerly loaded
     */
    @Query("SELECT DISTINCT la FROM LoanApplication la " +
           "LEFT JOIN FETCH la.documents " +
           "WHERE la.id = :id")
    Optional<LoanApplication> findByIdWithDocuments(@Param("id") UUID id);
}
