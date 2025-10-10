package com.tss.loan.service;

import java.util.List;
import java.util.UUID;

import com.tss.loan.dto.request.ApplicantFinancialDetailsRequest;
import com.tss.loan.dto.request.ApplicantPersonalDetailsRequest;
import com.tss.loan.dto.request.LoanApplicationRequest;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.LoanApplicationCreateResponse;
import com.tss.loan.dto.response.PersonalDetailsUpdateResponse;
import com.tss.loan.dto.response.FinancialDetailsCreateResponse;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;

public interface LoanApplicationService {
    
    /**
     * Create a new loan application (DRAFT status)
     */
    LoanApplicationResponse createLoanApplication(LoanApplicationRequest request, User applicant);
    
    /**
     * Update personal details for loan application
     */
    LoanApplication updatePersonalDetails(UUID applicationId, 
                                        ApplicantPersonalDetailsRequest request, User user);
    
    /**
     * Update financial details for loan application
     */
    LoanApplication updateFinancialDetails(UUID applicationId, 
                                         ApplicantFinancialDetailsRequest request, User user);
    
    /**
     * Submit loan application (change status from DRAFT to SUBMITTED)
     */
    LoanApplication submitLoanApplication(UUID applicationId, User user);
    
    /**
     * Get loan application by ID
     */
    LoanApplicationResponse getLoanApplicationById(UUID applicationId);
    
    /**
     * Get all loan applications for a user
     */
    List<LoanApplicationResponse> getLoanApplicationsByUser(User user);
    
    /**
     * Get loan applications by status
     */
    List<LoanApplicationResponse> getLoanApplicationsByStatus(String status);
    
    /**
     * Internal method to get entity (for service layer use only)
     */
    LoanApplication getLoanApplicationEntityById(UUID applicationId);
    
    /**
     * Check if application is complete (all required fields filled)
     */
    boolean isApplicationComplete(UUID applicationId);
    
    /**
     * Calculate application progress percentage
     */
    int calculateApplicationProgress(UUID applicationId);
    
    /**
     * Create loan application with minimal response
     */
    LoanApplicationCreateResponse createLoanApplicationWithMinimalResponse(LoanApplicationRequest request, User applicant);
    
    /**
     * Update personal details from application context and fetch existing data
     */
    PersonalDetailsUpdateResponse updatePersonalDetailsFromApplication(UUID applicationId, 
                                                                     ApplicantPersonalDetailsRequest request, User user);
    
    /**
     * Create financial details for application
     */
    FinancialDetailsCreateResponse createFinancialDetailsForApplication(UUID applicationId, 
                                                                       ApplicantFinancialDetailsRequest request, User user);
    
    /**
     * Update financial details for application
     */
    FinancialDetailsCreateResponse updateFinancialDetailsForApplication(UUID applicationId, 
                                                                       ApplicantFinancialDetailsRequest request, User user);
}
