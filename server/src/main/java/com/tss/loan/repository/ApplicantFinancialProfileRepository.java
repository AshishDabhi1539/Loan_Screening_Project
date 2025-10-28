package com.tss.loan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.financial.ApplicantFinancialProfile;

@Repository
public interface ApplicantFinancialProfileRepository extends JpaRepository<ApplicantFinancialProfile, UUID> {
    
    Optional<ApplicantFinancialProfile> findByLoanApplication(com.tss.loan.entity.loan.LoanApplication loanApplication);
    
    Optional<ApplicantFinancialProfile> findByLoanApplicationId(UUID loanApplicationId);
}
