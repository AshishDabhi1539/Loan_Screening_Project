package com.tss.loan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.enums.ApplicationStatus;
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
    
    long countByApplicantId(UUID applicantId);
    
    // Methods needed for assignment service
    int countByAssignedOfficerAndStatusIn(User assignedOfficer, List<ApplicationStatus> statuses);
    
    // Methods needed for compliance officer assignment service
    int countByAssignedComplianceOfficerAndStatusIn(User assignedComplianceOfficer, List<ApplicationStatus> statuses);
    
    List<LoanApplication> findByAssignedOfficerOrderByCreatedAtDesc(User assignedOfficer);
    
    List<LoanApplication> findByAssignedComplianceOfficerOrderByCreatedAtDesc(User assignedComplianceOfficer);
    
    List<LoanApplication> findByAssignedComplianceOfficerAndStatus(User assignedComplianceOfficer, ApplicationStatus status);
}
