package com.tss.loan.service;

import java.math.BigDecimal;

import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;

/**
 * Service for automatically assigning loan applications to loan officers
 */
public interface ApplicationAssignmentService {
    
    /**
     * Auto-assign application to available loan officer
     * @param application The loan application to assign
     * @return The assigned loan officer
     */
    User assignToLoanOfficer(LoanApplication application);
    
    /**
     * Get the best available loan officer based on workload and expertise
     * @param requestedAmount The loan amount (for specialization)
     * @return The most suitable loan officer
     */
    User getBestAvailableOfficer(BigDecimal requestedAmount);
    
    /**
     * Check if officer has capacity for new assignments
     * @param officer The loan officer to check
     * @return true if officer can take new assignments
     */
    boolean hasCapacity(User officer);
    
    /**
     * Get current workload count for officer
     * @param officer The loan officer
     * @return Number of active applications assigned
     */
    int getCurrentWorkload(User officer);
    
    /**
     * Auto-assign application to available compliance officer when flagged
     * @param application The loan application flagged for compliance
     * @param flagReason The reason for flagging
     * @param priorityLevel The priority level (HIGH, MEDIUM, LOW)
     * @return The assigned compliance officer
     */
    User assignToComplianceOfficer(LoanApplication application, String flagReason, String priorityLevel);
    
    /**
     * Get the best available compliance officer based on workload and priority
     * @param priorityLevel The priority level for assignment preference
     * @return The most suitable compliance officer
     */
    User getBestAvailableComplianceOfficer(String priorityLevel);
    
    /**
     * Get current compliance workload count for officer
     * @param complianceOfficer The compliance officer
     * @return Number of active compliance cases assigned
     */
    int getCurrentComplianceWorkload(User complianceOfficer);
}
