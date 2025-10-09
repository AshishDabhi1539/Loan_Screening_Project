package com.tss.loan.mapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.service.ProfileCompletionService;

@Component
public class LoanApplicationMapper {
    
    @Autowired
    private ProfileCompletionService profileCompletionService;
    
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
                
                // Officer info (NO circular reference)
                .assignedOfficerId(entity.getAssignedOfficer() != null ? entity.getAssignedOfficer().getId() : null)
                .assignedOfficerName(entity.getAssignedOfficer() != null ? entity.getAssignedOfficer().getEmail() : null)
                .decidedById(entity.getDecidedBy() != null ? entity.getDecidedBy().getId() : null)
                .decidedByName(entity.getDecidedBy() != null ? entity.getDecidedBy().getEmail() : null)
                
                // Metadata
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .version(entity.getVersion())
                
                // Counts (NO circular reference)
                .documentsCount(entity.getDocuments() != null ? entity.getDocuments().size() : 0)
                .fraudCheckResultsCount(entity.getFraudCheckResults() != null ? entity.getFraudCheckResults().size() : 0)
                
                // Status flags - using new architecture
                .hasPersonalDetails(entity.getApplicant() != null ? 
                    profileCompletionService.hasPersonalDetails(entity.getApplicant()) : false)
                .hasFinancialProfile(entity.getFinancialProfile() != null)
                .build();
    }
}
