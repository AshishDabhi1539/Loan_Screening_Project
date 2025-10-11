package com.tss.loan.service;

import com.tss.loan.dto.request.ComplianceFlagRequest;
import com.tss.loan.dto.request.LoanDecisionRequest;
import com.tss.loan.dto.response.LoanDecisionResponse;
import com.tss.loan.entity.user.User;

import java.util.UUID;

/**
 * Service interface for loan decision management
 */
public interface DecisionManagementService {
    
    /**
     * Approve a loan application
     */
    LoanDecisionResponse approveLoanApplication(UUID applicationId, LoanDecisionRequest request, User decisionMaker);
    
    /**
     * Reject a loan application
     */
    LoanDecisionResponse rejectLoanApplication(UUID applicationId, LoanDecisionRequest request, User decisionMaker);
    
    /**
     * Flag application for compliance review
     */
    LoanDecisionResponse flagForCompliance(UUID applicationId, ComplianceFlagRequest request, User officer);
    
    /**
     * Check if user has authority to make decision for application
     */
    boolean hasDecisionAuthority(UUID applicationId, User user);
    
    /**
     * Get decision history for application
     */
    // List<LoanDecisionResponse> getDecisionHistory(UUID applicationId);
    
    /**
     * Validate decision request
     */
    void validateDecisionRequest(UUID applicationId, LoanDecisionRequest request);
    
    /**
     * Calculate next workflow status based on decision
     */
    // ApplicationStatus calculateNextStatus(LoanApplication application, DecisionType decision);
}
