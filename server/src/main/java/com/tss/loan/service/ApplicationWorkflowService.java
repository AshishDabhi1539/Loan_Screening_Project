package com.tss.loan.service;

import java.util.List;
import java.util.UUID;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.user.User;
import com.tss.loan.entity.workflow.ApplicationWorkflow;

public interface ApplicationWorkflowService {
    
    /**
     * Create workflow entry for status change
     */
    ApplicationWorkflow createWorkflowEntry(UUID loanApplicationId,
                                            ApplicationStatus fromStatus,
                                            ApplicationStatus toStatus,
                                            User actionBy,
                                            String comments);
    
    /**
     * Get workflow history for loan application
     */
    List<ApplicationWorkflow> getWorkflowHistory(UUID loanApplicationId);
    
    /**
     * Get current status of application
     */
    ApplicationStatus getCurrentStatus(UUID loanApplicationId);
    
    /**
     * Check if status transition is valid
     */
    boolean isValidStatusTransition(ApplicationStatus fromStatus, ApplicationStatus toStatus);
    
    /**
     * Get next possible statuses from current status
     */
    List<ApplicationStatus> getNextPossibleStatuses(ApplicationStatus currentStatus);
}
