package com.tss.loan.mapper;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.service.OfficerProfileService;

@Component
public class LoanApplicationMapper {
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    @Autowired
    private OfficerProfileService officerProfileService;
    
    public LoanApplicationResponse toResponse(LoanApplication entity) {
        if (entity == null) {
            return null;
        }
        
        return LoanApplicationResponse.builder()
                .id(entity.getId())
                .applicantName(entity.getApplicantName())
                .applicantEmail(entity.getApplicantEmail())
                .applicantPhone(entity.getApplicantPhone())
                .loanType(entity.getLoanType())
                .requestedAmount(entity.getRequestedAmount())
                .tenureMonths(entity.getTenureMonths())
                .purpose(entity.getPurpose())
                .existingLoans(entity.getExistingLoans())
                .existingEmi(entity.getExistingEmi())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .riskLevel(entity.getRiskLevel())
                .submittedAt(entity.getSubmittedAt())
                .reviewedAt(entity.getReviewedAt())
                .finalDecisionAt(entity.getFinalDecisionAt())
                .remarks(entity.getRemarks())
                .decisionType(entity.getDecisionType())
                .approvedAmount(entity.getApprovedAmount())
                .approvedInterestRate(entity.getApprovedInterestRate())
                .approvedTenureMonths(entity.getApprovedTenureMonths())
                .decisionReason(entity.getDecisionReason())
                .decidedAt(entity.getDecidedAt())
                .riskScore(entity.getRiskScore())
                .fraudScore(entity.getFraudScore())
                .fraudReasons(entity.getFraudReasons())
                
                // Applicant info (NO circular reference)
                .applicantId(entity.getApplicant() != null ? entity.getApplicant().getId() : null)
                
                // Officer info (NO circular reference) - Using proper name resolution
                .assignedOfficerId(entity.getAssignedOfficer() != null ? entity.getAssignedOfficer().getId() : null)
                .assignedOfficerName(entity.getAssignedOfficer() != null ? 
                    officerProfileService.getOfficerDisplayName(entity.getAssignedOfficer()) : null)
                .decidedById(entity.getDecidedBy() != null ? entity.getDecidedBy().getId() : null)
                .decidedByName(entity.getDecidedBy() != null ? 
                    officerProfileService.getOfficerDisplayName(entity.getDecidedBy()) : null)
                
                // Metadata
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                
                // Counts (safely handle lazy loading)
                .documentsCount(safeGetDocumentsCount(entity))
                .fraudCheckResultsCount(0) // Default to 0 as fraudCheckResults collection doesn't exist yet
                
                // Status flags
                .hasPersonalDetails(entity.getApplicant() != null && hasPersonalDetails(entity.getApplicant().getId()))
                .hasFinancialProfile(entity.getFinancialProfile() != null)
                
                // Employment type (safely handle lazy loading)
                .employmentType(safeGetEmploymentType(entity))
                .build();
    }
    
    /**
     * Helper method to check if user has personal details
     */
    private boolean hasPersonalDetails(UUID userId) {
        if (userId == null) {
            return false;
        }
        return personalDetailsRepository.existsByUserId(userId);
    }
    
    /**
     * Safely get documents count without triggering lazy loading exception
     */
    private int safeGetDocumentsCount(LoanApplication entity) {
        try {
            return (entity.getDocuments() != null) ? entity.getDocuments().size() : 0;
        } catch (Exception e) {
            // LazyInitializationException or other hibernate exception
            return 0;
        }
    }
    
    /**
     * Safely get employment type without triggering lazy loading exception
     */
    private String safeGetEmploymentType(LoanApplication entity) {
        try {
            if (entity.getFinancialProfile() != null && 
                entity.getFinancialProfile().getEmploymentType() != null) {
                return entity.getFinancialProfile().getEmploymentType().name();
            }
            return null;
        } catch (Exception e) {
            // LazyInitializationException or other hibernate exception
            return null;
        }
    }
}
