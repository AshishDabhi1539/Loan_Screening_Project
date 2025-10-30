package com.tss.loan.service;

import com.tss.loan.entity.enums.EmploymentType;
import com.tss.loan.entity.enums.LoanType;

import java.util.List;
import java.util.Map;

/**
 * Service for determining loan eligibility based on employment type and other factors
 */
public interface LoanEligibilityService {
    
    /**
     * Get eligible employment types for a given loan type
     * @param loanType The type of loan
     * @return List of eligible employment types
     */
    List<EmploymentType> getEligibleEmploymentTypes(LoanType loanType);
    
    /**
     * Check if an employment type is eligible for a loan type
     * @param loanType The type of loan
     * @param employmentType The employment type
     * @return true if eligible, false otherwise
     */
    boolean isEmploymentTypeEligible(LoanType loanType, EmploymentType employmentType);
    
    /**
     * Get minimum income requirement for a loan type
     * @param loanType The type of loan
     * @return Minimum monthly income required
     */
    double getMinimumIncomeRequirement(LoanType loanType);
    
    /**
     * Get minimum employment duration (in months) for a loan type
     * @param loanType The type of loan
     * @param employmentType The employment type
     * @return Minimum months of employment/business operation
     */
    int getMinimumEmploymentDuration(LoanType loanType, EmploymentType employmentType);
    
    /**
     * Calculate Fixed Obligation to Income Ratio (FOIR)
     * @param monthlyIncome Total monthly income
     * @param existingObligations Existing EMIs and obligations
     * @param newEmi New EMI for the loan being applied
     * @return FOIR percentage (0-100)
     */
    double calculateFOIR(double monthlyIncome, double existingObligations, double newEmi);
    
    /**
     * Check if FOIR is within acceptable limits
     * @param foir FOIR percentage
     * @return true if acceptable, false otherwise
     */
    boolean isFOIRAcceptable(double foir);
    
    /**
     * Get eligibility reason/message
     * @param loanType The type of loan
     * @param employmentType The employment type
     * @return Reason why employment type is eligible or not eligible
     */
    String getEligibilityReason(LoanType loanType, EmploymentType employmentType);
    
    /**
     * Get all eligibility criteria for a loan type
     * @param loanType The type of loan
     * @return Map of criteria names to values
     */
    Map<String, Object> getLoanEligibilityCriteria(LoanType loanType);
}
