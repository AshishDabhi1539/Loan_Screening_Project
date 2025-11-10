package com.tss.loan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.loan.LoanDocument;

@Repository
public interface LoanDocumentRepository extends JpaRepository<LoanDocument, Long> {
    
    List<LoanDocument> findByLoanApplicationId(UUID loanApplicationId);
    
    List<LoanDocument> findByLoanApplicationIdOrderByUploadedAtDesc(UUID loanApplicationId);
    
    long countByLoanApplicationId(UUID loanApplicationId);
    
    List<LoanDocument> findByUploadedBy(com.tss.loan.entity.user.User uploadedBy);
    
    // Count methods for compliance review summary
    int countByLoanApplication(com.tss.loan.entity.loan.LoanApplication loanApplication);
    
    int countByLoanApplicationAndVerificationStatus(
        com.tss.loan.entity.loan.LoanApplication loanApplication, 
        com.tss.loan.entity.enums.VerificationStatus verificationStatus
    );
    
    // ========== JOIN FETCH QUERIES TO ELIMINATE N+1 ==========
    
    /**
     * Get documents with user relationships eagerly loaded
     * Use this to avoid N+1 queries when accessing uploadedBy and verifiedBy
     */
    @Query("SELECT d FROM LoanDocument d " +
           "LEFT JOIN FETCH d.uploadedBy " +
           "LEFT JOIN FETCH d.verifiedBy " +
           "WHERE d.loanApplication.id = :applicationId " +
           "ORDER BY d.uploadedAt DESC")
    List<LoanDocument> findByLoanApplicationIdWithDetailsOrderByUploadedAtDesc(@Param("applicationId") UUID applicationId);
}
