package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.ComplianceDecisionRequest;
import com.tss.loan.dto.request.ComplianceDocumentRequest;
import com.tss.loan.dto.response.ComplianceDashboardResponse;
import com.tss.loan.dto.response.ComplianceDecisionResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.service.ApplicationAssignmentService;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.ComplianceOfficerService;
import com.tss.loan.service.LoanOfficerService;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@Transactional
public class ComplianceOfficerServiceImpl implements ComplianceOfficerService {
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private LoanApplicationMapper loanApplicationMapper;
    
    @Autowired
    private ApplicationWorkflowService workflowService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    
    @Autowired
    private ApplicationAssignmentService assignmentService;
    
    @Autowired
    private LoanOfficerService loanOfficerService;
    
    @Override
    public ComplianceDashboardResponse getDashboard(User complianceOfficer) {
        log.info("Building compliance dashboard for officer: {}", complianceOfficer.getEmail());
        
        // Get assigned applications
        List<LoanApplication> assignedApplications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer);
        
        // Calculate statistics
        int totalAssigned = assignedApplications.size();
        int flaggedForCompliance = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.FLAGGED_FOR_COMPLIANCE)
            .count();
        int underReview = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.COMPLIANCE_REVIEW)
            .count();
        int pendingDocs = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.PENDING_COMPLIANCE_DOCS)
            .count();
        
        // Priority breakdown (assuming priority is stored in complianceNotes for now)
        int highPriority = (int) assignedApplications.stream()
            .filter(app -> app.getComplianceNotes() != null && app.getComplianceNotes().contains("HIGH"))
            .count();
        int mediumPriority = (int) assignedApplications.stream()
            .filter(app -> app.getComplianceNotes() != null && app.getComplianceNotes().contains("MEDIUM"))
            .count();
        int lowPriority = totalAssigned - highPriority - mediumPriority;
        
        // Recent activities
        List<ComplianceDashboardResponse.RecentComplianceActivity> recentActivities = 
            assignedApplications.stream()
                .limit(5)
                .map(this::mapToRecentActivity)
                .collect(Collectors.toList());
        
        return ComplianceDashboardResponse.builder()
            .officerId(complianceOfficer.getId())
            .officerName(complianceOfficer.getEmail()) // Using email as name for now
            .officerEmail(complianceOfficer.getEmail())
            .role(complianceOfficer.getRole().name())
            .totalAssignedApplications(totalAssigned)
            .flaggedForCompliance(flaggedForCompliance)
            .underComplianceReview(underReview)
            .pendingComplianceDocs(pendingDocs)
            .highPriorityApplications(highPriority)
            .mediumPriorityApplications(mediumPriority)
            .lowPriorityApplications(lowPriority)
            .recentActivities(recentActivities)
            .hasCapacityForNewCases(assignmentService.getCurrentComplianceWorkload(complianceOfficer) < getMaxCapacity(complianceOfficer))
            .lastUpdated(LocalDateTime.now())
            .dashboardVersion("1.0")
            .build();
    }
    
    @Override
    public List<LoanApplicationResponse> getAssignedApplications(User complianceOfficer) {
        log.info("Fetching assigned applications for compliance officer: {}", complianceOfficer.getEmail());
        
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer);
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public LoanApplicationResponse getApplicationForReview(UUID applicationId, User complianceOfficer) {
        log.info("Compliance officer {} reviewing application: {}", complianceOfficer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to review this application");
        }
        
        return loanApplicationMapper.toResponse(application);
    }
    
    @Override
    public CompleteApplicationDetailsResponse getCompleteApplicationDetails(UUID applicationId, User complianceOfficer) {
        log.info("Compliance officer {} requesting complete details for application: {}", complianceOfficer.getEmail(), applicationId);
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to view this application");
        }
        
        // Use internal method to bypass security restrictions
        CompleteApplicationDetailsResponse response = loanOfficerService.getCompleteApplicationDetailsInternal(applicationId);
        
        // Log audit event for compliance officer access
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_COMPLETE_APPLICATION_DETAILS_ACCESSED", "LoanApplication", 
            null, "Compliance officer accessed complete application details for review: " + applicationId);
        
        return response;
    }
    
    @Override
    public List<LoanApplicationResponse> getFlaggedApplications(User complianceOfficer) {
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer)
            .stream()
            .filter(app -> app.getStatus() == ApplicationStatus.FLAGGED_FOR_COMPLIANCE)
            .collect(Collectors.toList());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LoanApplicationResponse> getApplicationsUnderReview(User complianceOfficer) {
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer)
            .stream()
            .filter(app -> app.getStatus() == ApplicationStatus.COMPLIANCE_REVIEW)
            .collect(Collectors.toList());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<LoanApplicationResponse> getApplicationsPendingDocuments(User complianceOfficer) {
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer)
            .stream()
            .filter(app -> app.getStatus() == ApplicationStatus.PENDING_COMPLIANCE_DOCS)
            .collect(Collectors.toList());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public void startComplianceInvestigation(UUID applicationId, User complianceOfficer) {
        log.info("Starting compliance investigation for application: {}", applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to investigate this application");
        }
        
        // Update status
        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(ApplicationStatus.COMPLIANCE_REVIEW);
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, ApplicationStatus.COMPLIANCE_REVIEW, 
            complianceOfficer, "Compliance investigation started");
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_INVESTIGATION_STARTED", "LoanApplication", null,
            "Compliance investigation started for application: " + applicationId);
    }
    
    @Override
    public void requestComplianceDocuments(UUID applicationId, ComplianceDocumentRequest request, User complianceOfficer) {
        log.info("Compliance officer {} requesting documents for application: {}", complianceOfficer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to request documents for this application");
        }
        
        // Update status
        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(ApplicationStatus.PENDING_COMPLIANCE_DOCS);
        application.setComplianceNotes(application.getComplianceNotes() + " | Document Request: " + request.getRequestReason());
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, ApplicationStatus.PENDING_COMPLIANCE_DOCS, 
            complianceOfficer, "Compliance documents requested: " + request.getRequestReason());
        
        // Send notification to applicant
        // notificationService.sendComplianceDocumentRequest(application, request, complianceOfficer);
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_DOCUMENTS_REQUESTED", "LoanApplication", null,
            String.format("Compliance documents requested. Reason: %s. Documents: %s", 
                request.getRequestReason(), String.join(", ", request.getRequiredDocumentTypes())));
    }
    
    @Override
    public ComplianceDecisionResponse clearCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer) {
        log.info("Compliance officer {} clearing application: {}", complianceOfficer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to clear this application");
        }
        
        // Update status back to ready for decision
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.READY_FOR_DECISION;
        application.setStatus(newStatus);
        application.setComplianceNotes(application.getComplianceNotes() + " | CLEARED: " + request.getDecisionReason());
        application.setUpdatedAt(LocalDateTime.now());
        
        // Clear compliance officer assignment (return to loan officer)
        application.setAssignedComplianceOfficer(null);
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, newStatus, complianceOfficer, 
            "Compliance cleared: " + request.getDecisionReason());
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_CLEARED", "LoanApplication", null,
            "Application cleared from compliance review. Reason: " + request.getDecisionReason());
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(complianceOfficer.getEmail())
            .decisionType(ComplianceDecisionRequest.ComplianceDecisionType.CLEARED)
            .newStatus(newStatus)
            .previousStatus(previousStatus)
            .decisionReason(request.getDecisionReason())
            .additionalNotes(request.getAdditionalNotes())
            .decisionTimestamp(LocalDateTime.now())
            .nextSteps("Application returned to loan officer for final decision")
            .requiresRegulatoryReporting(false)
            .canBeAppealed(false)
            .build();
    }
    
    @Override
    public ComplianceDecisionResponse rejectForCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer) {
        log.info("Compliance officer {} rejecting application for compliance violation: {}", complianceOfficer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to reject this application");
        }
        
        // Update status to rejected
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.REJECTED;
        application.setStatus(newStatus);
        application.setRejectionReason("Compliance Violation: " + request.getComplianceViolationType());
        application.setComplianceNotes(application.getComplianceNotes() + " | REJECTED: " + request.getDecisionReason());
        application.setFinalDecisionAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, newStatus, complianceOfficer, 
            "Rejected for compliance violation: " + request.getDecisionReason());
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_VIOLATION_REJECTED", "LoanApplication", null,
            String.format("Application rejected for compliance violation. Type: %s. Reason: %s", 
                request.getComplianceViolationType(), request.getDecisionReason()));
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(complianceOfficer.getEmail())
            .decisionType(ComplianceDecisionRequest.ComplianceDecisionType.REJECTED)
            .newStatus(newStatus)
            .previousStatus(previousStatus)
            .decisionReason(request.getDecisionReason())
            .additionalNotes(request.getAdditionalNotes())
            .decisionTimestamp(LocalDateTime.now())
            .nextSteps("Application process completed due to compliance violation")
            .requiresRegulatoryReporting(request.isRequiresRegulatoryReporting())
            .complianceViolationType(request.getComplianceViolationType())
            .canBeAppealed(true)
            .build();
    }
    
    @Override
    public void escalateToSenior(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer) {
        log.info("Compliance officer {} escalating application to senior: {}", complianceOfficer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Verify authority (only regular compliance officers can escalate)
        if (complianceOfficer.getRole() != RoleType.COMPLIANCE_OFFICER) {
            throw new LoanApiException("Only compliance officers can escalate to senior officers");
        }
        
        // Find and assign senior compliance officer (use HIGH priority for escalations)
        User seniorOfficer = assignmentService.getBestAvailableComplianceOfficer("HIGH");
        if (seniorOfficer == null) {
            throw new LoanApiException("No senior compliance officer available for escalation");
        }
        
        // Verify the assigned officer is actually a senior compliance officer
        if (seniorOfficer.getRole() != RoleType.SENIOR_COMPLIANCE_OFFICER) {
            throw new LoanApiException("Escalation requires a senior compliance officer but none are available");
        }
        
        // Update assignment
        application.setAssignedComplianceOfficer(seniorOfficer);
        application.setComplianceNotes(application.getComplianceNotes() + " | ESCALATED: " + request.getEscalationReason());
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_ESCALATED", "LoanApplication", null,
            String.format("Application escalated to senior compliance officer %s. Reason: %s", 
                seniorOfficer.getEmail(), request.getEscalationReason()));
    }
    
    @Override
    public boolean hasComplianceAuthority(UUID applicationId, User complianceOfficer) {
        // Check user role
        RoleType role = complianceOfficer.getRole();
        if (role != RoleType.COMPLIANCE_OFFICER && role != RoleType.SENIOR_COMPLIANCE_OFFICER) {
            return false;
        }
        
        // Get application to check assignment
        LoanApplication application = loanApplicationRepository.findById(applicationId).orElse(null);
        if (application == null) {
            return false;
        }
        
        // Check if user is assigned to this application
        return application.getAssignedComplianceOfficer() != null && 
               application.getAssignedComplianceOfficer().getId().equals(complianceOfficer.getId());
    }
    
    @Override
    public int getCurrentWorkload(User complianceOfficer) {
        return assignmentService.getCurrentComplianceWorkload(complianceOfficer);
    }
    
    private ComplianceDashboardResponse.RecentComplianceActivity mapToRecentActivity(LoanApplication application) {
        return ComplianceDashboardResponse.RecentComplianceActivity.builder()
            .applicationId(application.getId())
            .applicantName(application.getApplicant().getEmail()) // Using email as name for now
            .action("Compliance Review")
            .status(application.getStatus().name())
            .flagReason(extractFlagReason(application.getComplianceNotes()))
            .priority(extractPriority(application.getComplianceNotes()))
            .timestamp(application.getUpdatedAt())
            .description("Application under compliance review")
            .build();
    }
    
    private String extractFlagReason(String complianceNotes) {
        if (complianceNotes == null) return "Not specified";
        // Extract flag reason from compliance notes (simple implementation)
        return complianceNotes.length() > 50 ? complianceNotes.substring(0, 50) + "..." : complianceNotes;
    }
    
    private String extractPriority(String complianceNotes) {
        if (complianceNotes == null) return "MEDIUM";
        if (complianceNotes.contains("HIGH")) return "HIGH";
        if (complianceNotes.contains("LOW")) return "LOW";
        return "MEDIUM";
    }
    
    private int getMaxCapacity(User complianceOfficer) {
        return complianceOfficer.getRole() == RoleType.SENIOR_COMPLIANCE_OFFICER ? 15 : 10;
    }
}
