package com.tss.loan.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.tss.loan.entity.applicant.ApplicantPersonalDetails;

@Repository
public interface ApplicantPersonalDetailsRepository extends JpaRepository<ApplicantPersonalDetails, UUID> {
    
    Optional<ApplicantPersonalDetails> findByUserId(UUID userId);
    
    boolean existsByUserId(UUID userId);
    
    Optional<ApplicantPersonalDetails> findByPanNumber(String panNumber);
    
    Optional<ApplicantPersonalDetails> findByAadhaarNumber(String aadhaarNumber);
    
    // Legacy method for backward compatibility - will be removed
    @Deprecated
    default Optional<ApplicantPersonalDetails> findByLoanApplication(com.tss.loan.entity.loan.LoanApplication loanApplication) {
        if (loanApplication != null && loanApplication.getApplicant() != null) {
            return findByUserId(loanApplication.getApplicant().getId());
        }
        return Optional.empty();
    }
}
