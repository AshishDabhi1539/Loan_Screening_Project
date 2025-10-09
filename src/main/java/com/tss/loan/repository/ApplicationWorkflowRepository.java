package com.tss.loan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.workflow.ApplicationWorkflow;

@Repository
public interface ApplicationWorkflowRepository extends JpaRepository<ApplicationWorkflow, UUID> {
    
    List<ApplicationWorkflow> findByLoanApplicationOrderByProcessedAtDesc(com.tss.loan.entity.loan.LoanApplication loanApplication);
    
    List<ApplicationWorkflow> findByProcessedBy(com.tss.loan.entity.user.User processedBy);
}
