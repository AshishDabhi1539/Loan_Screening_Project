package com.tss.loan.service.impl;

import com.tss.loan.dto.request.ComplianceFlagRequest;
import com.tss.loan.dto.request.LoanDecisionRequest;
import com.tss.loan.dto.response.LoanDecisionResponse;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.DecisionType;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.DecisionManagementService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Implementation of Decision Management Service
 */
@Service
@Slf4j
@Transactional
public class DecisionManagementServiceImpl implements DecisionManagementService {
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private ApplicationWorkflowService workflowService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Override
    public LoanDecisionResponse approveLoanApplication(UUID applicationId, LoanDecisionRequest request, User decisionMaker) {
        log.info("Processing loan approval for application: {} by user: {}", applicationId, decisionMaker.getEmail());
        
        // Validate decision authority
        if (!hasDecisionAuthority(applicationId, decisionMaker)) {
            throw new LoanApiException("You do not have authority to approve this application");
        }
        
        // Validate decision request
        validateDecisionRequest(applicationId, request);
        validateApprovalRequest(request);
        
        // Get application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Update application with approval details
        application.setDecisionType(DecisionType.APPROVED);
        application.setApprovedAmount(request.getApprovedAmount());
        application.setApprovedInterestRate(request.getApprovedInterestRate());
        application.setApprovedTenureMonths(request.getApprovedTenureMonths());
        application.setDecisionReason(request.getDecisionReason());
        application.setFinalDecisionAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        // Update workflow status
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.APPROVED;
        application.setStatus(newStatus);
        
        // Save application
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Log workflow transition
        try {
            workflowService.createWorkflowEntry(savedApplication.getId(), previousStatus, newStatus, decisionMaker, 
                "Loan approved: " + request.getDecisionReason());
        } catch (Exception e) {
            log.warn("Failed to log workflow transition: {}", e.getMessage());
        }
        
        // Log audit event
        auditLogService.logAction(decisionMaker, "LOAN_APPROVED", "LoanApplication", null,
            String.format("Loan approved for amount: %s, rate: %s%%, tenure: %d months. Reason: %s",
                request.getApprovedAmount(), request.getApprovedInterestRate(), 
                request.getApprovedTenureMonths(), request.getDecisionReason()));
        
        // Send notification to applicant (placeholder - will implement notification methods)
        // notificationService.sendLoanApprovalNotification(savedApplication, decisionMaker);
        
        log.info("Loan application {} approved successfully by {}", applicationId, decisionMaker.getEmail());
        
        return buildDecisionResponse(savedApplication, decisionMaker, previousStatus.name());
    }
    
    @Override
    public LoanDecisionResponse rejectLoanApplication(UUID applicationId, LoanDecisionRequest request, User decisionMaker) {
        log.info("Processing loan rejection for application: {} by user: {}", applicationId, decisionMaker.getEmail());
        
        // Validate decision authority
        if (!hasDecisionAuthority(applicationId, decisionMaker)) {
            throw new LoanApiException("You do not have authority to reject this application");
        }
        
        // Validate decision request
        validateDecisionRequest(applicationId, request);
        validateRejectionRequest(request);
        
        // Get application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Update application with rejection details
        application.setDecisionType(DecisionType.REJECTED);
        application.setDecisionReason(request.getDecisionReason());
        application.setRejectionReason(request.getRejectionReason());
        application.setFinalDecisionAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        // Update workflow status
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.REJECTED;
        application.setStatus(newStatus);
        
        // Save application
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Log workflow transition
        try {
            workflowService.createWorkflowEntry(savedApplication.getId(), previousStatus, newStatus, decisionMaker, 
                "Loan rejected: " + request.getDecisionReason());
        } catch (Exception e) {
            log.warn("Failed to log workflow transition: {}", e.getMessage());
        }
        
        // Log audit event
        auditLogService.logAction(decisionMaker, "LOAN_REJECTED", "LoanApplication", null,
            String.format("Loan rejected. Reason: %s. Rejection details: %s",
                request.getDecisionReason(), request.getRejectionReason()));
        
        // Send notification to applicant (placeholder)
        // notificationService.sendLoanRejectionNotification(savedApplication, decisionMaker);
        
        log.info("Loan application {} rejected successfully by {}", applicationId, decisionMaker.getEmail());
        
        return buildDecisionResponse(savedApplication, decisionMaker, previousStatus.name());
    }
    
    @Override
    public LoanDecisionResponse flagForCompliance(UUID applicationId, ComplianceFlagRequest request, User officer) {
        log.info("Flagging application {} for compliance review by user: {}", applicationId, officer.getEmail());
        
        // Validate officer authority
        if (!hasDecisionAuthority(applicationId, officer)) {
            throw new LoanApiException("You do not have authority to flag this application");
        }
        
        // Get application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Validate current status allows flagging
        if (!canBeFlaggedForCompliance(application.getStatus())) {
            throw new LoanApiException("Application cannot be flagged for compliance in current status: " + application.getStatus());
        }
        
        // Update application status
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.FLAGGED_FOR_COMPLIANCE;
        application.setStatus(newStatus);
        application.setComplianceNotes(request.getFlagReason() + 
            (request.getAdditionalDetails() != null ? " | " + request.getAdditionalDetails() : ""));
        application.setUpdatedAt(LocalDateTime.now());
        
        // Save application
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Log workflow transition
        try {
            workflowService.createWorkflowEntry(savedApplication.getId(), previousStatus, newStatus, officer, 
                "Application flagged for compliance: " + request.getFlagReason());
        } catch (Exception e) {
            log.warn("Failed to log workflow transition: {}", e.getMessage());
        }
        
        // Log audit event
        auditLogService.logAction(officer, "APPLICATION_FLAGGED_FOR_COMPLIANCE", "LoanApplication", null,
            String.format("Application flagged for compliance review. Reason: %s. Priority: %s",
                request.getFlagReason(), request.getPriorityLevel()));
        
        // Send notification to compliance officers (placeholder)
        // notificationService.sendComplianceFlagNotification(savedApplication, officer, request);
        
        log.info("Application {} flagged for compliance review successfully", applicationId);
        
        return LoanDecisionResponse.builder()
            .applicationId(applicationId)
            .decisionMakerId(officer.getId())
            .decisionMakerName(officer.getEmail()) // Using email as name for now
            .decisionType(null) // No decision type for flagging
            .newStatus(newStatus)
            .decisionReason(request.getFlagReason())
            .decisionTimestamp(LocalDateTime.now())
            .additionalNotes(request.getAdditionalDetails())
            .previousStatus(previousStatus.name())
            .nextSteps("Application will be reviewed by compliance officer")
            .build();
    }
    
    @Override
    public boolean hasDecisionAuthority(UUID applicationId, User user) {
        // Check user role
        RoleType role = user.getRole();
        
        // Only loan officers and senior officers can make decisions
        if (role != RoleType.LOAN_OFFICER && role != RoleType.SENIOR_LOAN_OFFICER && role != RoleType.ADMIN) {
            return false;
        }
        
        // Get application to check assignment
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElse(null);
        
        if (application == null) {
            return false;
        }
        
        // Check if user is assigned to this application or is admin
        return user.getRole() == RoleType.ADMIN || 
               (application.getAssignedOfficer() != null && application.getAssignedOfficer().getId().equals(user.getId()));
    }
    
    @Override
    public void validateDecisionRequest(UUID applicationId, LoanDecisionRequest request) {
        // Get application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Check if application is in correct status for decision
        if (application.getStatus() != ApplicationStatus.READY_FOR_DECISION) {
            throw new LoanApiException("Application is not ready for decision. Current status: " + application.getStatus());
        }
        
        // Validate decision type
        if (request.getDecisionType() == null) {
            throw new LoanApiException("Decision type is required");
        }
    }
    
    private void validateApprovalRequest(LoanDecisionRequest request) {
        if (request.getDecisionType() != DecisionType.APPROVED) {
            throw new LoanApiException("Invalid decision type for approval");
        }
        
        if (request.getApprovedAmount() == null || request.getApprovedAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new LoanApiException("Approved amount must be greater than zero");
        }
        
        if (request.getApprovedInterestRate() == null || request.getApprovedInterestRate().compareTo(BigDecimal.ZERO) <= 0) {
            throw new LoanApiException("Approved interest rate must be greater than zero");
        }
        
        if (request.getApprovedTenureMonths() == null || request.getApprovedTenureMonths() <= 0) {
            throw new LoanApiException("Approved tenure must be greater than zero months");
        }
    }
    
    private void validateRejectionRequest(LoanDecisionRequest request) {
        if (request.getDecisionType() != DecisionType.REJECTED) {
            throw new LoanApiException("Invalid decision type for rejection");
        }
        
        if (request.getRejectionReason() == null || request.getRejectionReason().trim().isEmpty()) {
            throw new LoanApiException("Rejection reason is required");
        }
    }
    
    private boolean canBeFlaggedForCompliance(ApplicationStatus status) {
        return status == ApplicationStatus.UNDER_REVIEW ||
               status == ApplicationStatus.DOCUMENT_VERIFICATION ||
               status == ApplicationStatus.FINANCIAL_REVIEW ||
               status == ApplicationStatus.RISK_ASSESSMENT ||
               status == ApplicationStatus.FRAUD_CHECK ||
               status == ApplicationStatus.READY_FOR_DECISION;
    }
    
    private LoanDecisionResponse buildDecisionResponse(LoanApplication application, User decisionMaker, String previousStatus) {
        return LoanDecisionResponse.builder()
            .applicationId(application.getId())
            .decisionMakerId(decisionMaker.getId())
            .decisionMakerName(decisionMaker.getEmail()) // Using email as name for now
            .decisionType(application.getDecisionType())
            .newStatus(application.getStatus())
            .decisionReason(application.getDecisionReason())
            .decisionTimestamp(application.getFinalDecisionAt())
            .approvedAmount(application.getApprovedAmount())
            .approvedInterestRate(application.getApprovedInterestRate())
            .approvedTenureMonths(application.getApprovedTenureMonths())
            .rejectionReason(application.getRejectionReason())
            .previousStatus(previousStatus)
            .canBeAppealed(application.getStatus() == ApplicationStatus.REJECTED)
            .nextSteps(calculateNextSteps(application))
            .build();
    }
    
    private String calculateNextSteps(LoanApplication application) {
        switch (application.getStatus()) {
            case APPROVED:
                return "Proceed to documentation and disbursement process";
            case REJECTED:
                return "Application process completed. You may appeal within 30 days";
            case FLAGGED_FOR_COMPLIANCE:
                return "Application under compliance review";
            default:
                return "Application processing continues";
        }
    }
}
