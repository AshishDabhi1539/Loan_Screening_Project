package com.tss.loan.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.loan.LoanDocument;

@Repository
public interface LoanDocumentRepository extends JpaRepository<LoanDocument, UUID> {
    
    List<LoanDocument> findByLoanApplicationIdOrderByUploadedAtDesc(UUID loanApplicationId);
    
    long countByLoanApplicationId(UUID loanApplicationId);
    
    List<LoanDocument> findByUploadedBy(com.tss.loan.entity.user.User uploadedBy);
}
