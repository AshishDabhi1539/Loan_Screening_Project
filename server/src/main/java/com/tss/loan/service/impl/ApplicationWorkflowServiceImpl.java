package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.workflow.ApplicationWorkflow;
import com.tss.loan.entity.user.User;
import com.tss.loan.repository.ApplicationWorkflowRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
public class ApplicationWorkflowServiceImpl implements ApplicationWorkflowService {

    @Autowired
    private ApplicationWorkflowRepository workflowRepository;
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private AuditLogService auditLogService;

    @Override
    public ApplicationWorkflow createWorkflowEntry(UUID loanApplicationId, 
                                                 ApplicationStatus fromStatus, 
                                                 ApplicationStatus toStatus,
                                                 User actionBy, 
                                                 String comments) {
        
        log.info("Creating workflow entry: {} -> {} for application: {}", 
            fromStatus, toStatus, loanApplicationId);
        
        // Get the loan application
        LoanApplication loanApplication = loanApplicationRepository.findById(loanApplicationId)
            .orElseThrow(() -> new RuntimeException("Loan application not found"));
        
        ApplicationWorkflow workflow = new ApplicationWorkflow();
        workflow.setLoanApplication(loanApplication);
        workflow.setFromStatus(fromStatus);
        workflow.setToStatus(toStatus);
        workflow.setProcessedBy(actionBy);
        workflow.setComments(comments);
        workflow.setProcessedAt(LocalDateTime.now());
        
        ApplicationWorkflow savedWorkflow = workflowRepository.save(workflow);
        
        // Audit log
        auditLogService.logAction(actionBy, "STATUS_CHANGED", "LoanApplication", null,
            String.format("Status changed from %s to %s for application %s", 
                fromStatus, toStatus, loanApplicationId));
        
        log.info("Workflow entry created successfully: {}", savedWorkflow.getId());
        return savedWorkflow;
    }

    @Override
    public List<ApplicationWorkflow> getWorkflowHistory(UUID loanApplicationId) {
        LoanApplication loanApplication = loanApplicationRepository.findById(loanApplicationId)
            .orElseThrow(() -> new RuntimeException("Loan application not found"));
        return workflowRepository.findByLoanApplicationOrderByProcessedAtDesc(loanApplication);
    }

    @Override
    public ApplicationStatus getCurrentStatus(UUID loanApplicationId) {
        return loanApplicationRepository.findById(loanApplicationId)
            .map(app -> app.getStatus())
            .orElse(ApplicationStatus.DRAFT);
    }

    @Override
    public boolean isValidStatusTransition(ApplicationStatus fromStatus, ApplicationStatus toStatus) {
        // Define valid status transitions
        switch (fromStatus) {
            case DRAFT:
                return toStatus == ApplicationStatus.SUBMITTED;
                
            case SUBMITTED:
                return Arrays.asList(
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.REJECTED
                ).contains(toStatus);
                
            case UNDER_REVIEW:
                return Arrays.asList(
                    ApplicationStatus.APPROVED,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.DOCUMENT_INCOMPLETE
                ).contains(toStatus);
                
            case DOCUMENT_INCOMPLETE:
                return Arrays.asList(
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.REJECTED
                ).contains(toStatus);
                
            case APPROVED:
                return toStatus == ApplicationStatus.DISBURSED;
                
            case REJECTED:
            case DISBURSED:
                return false; // Terminal states
                
            default:
                return false;
        }
    }

    @Override
    public List<ApplicationStatus> getNextPossibleStatuses(ApplicationStatus currentStatus) {
        switch (currentStatus) {
            case DRAFT:
                return Arrays.asList(ApplicationStatus.SUBMITTED);
                
            case SUBMITTED:
                return Arrays.asList(
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.REJECTED
                );
                
            case UNDER_REVIEW:
                return Arrays.asList(
                    ApplicationStatus.APPROVED,
                    ApplicationStatus.REJECTED,
                    ApplicationStatus.DOCUMENT_INCOMPLETE
                );
                
            case DOCUMENT_INCOMPLETE:
                return Arrays.asList(
                    ApplicationStatus.UNDER_REVIEW,
                    ApplicationStatus.REJECTED
                );
                
            case APPROVED:
                return Arrays.asList(ApplicationStatus.DISBURSED);
                
            case REJECTED:
            case DISBURSED:
            default:
                return Arrays.asList(); // No further transitions
        }
    }
}
