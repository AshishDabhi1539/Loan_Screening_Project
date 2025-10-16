package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tss.loan.dto.request.ComplianceDecisionRequest;
import com.tss.loan.dto.request.ComplianceDocumentRequest;
import com.tss.loan.dto.response.ComplianceDashboardResponse;
import com.tss.loan.dto.response.ComplianceDecisionResponse;
import com.tss.loan.dto.response.ComplianceInvestigationResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.repository.external.ComplianceInvestigationRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.service.ApplicationAssignmentService;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.ComplianceOfficerService;
import com.tss.loan.service.LoanOfficerService;
import com.tss.loan.service.OfficerProfileService;
import com.tss.loan.service.ProfileCompletionService;

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
    private ComplianceInvestigationRepository complianceInvestigationRepository;
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    
    @Autowired
    private ApplicationAssignmentService assignmentService;
    
    @Autowired
    private LoanOfficerService loanOfficerService;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    @Autowired
    private OfficerProfileService officerProfileService;
    
    @Autowired
    private ProfileCompletionService profileCompletionService;
    
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
        
        // ✅ FIXED: Priority breakdown using proper Priority enum field
        int highPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == com.tss.loan.entity.enums.Priority.HIGH)
            .count();
        int mediumPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == com.tss.loan.entity.enums.Priority.MEDIUM)
            .count();
        int lowPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == com.tss.loan.entity.enums.Priority.LOW)
            .count();
        int criticalPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == com.tss.loan.entity.enums.Priority.CRITICAL)
            .count();
        
        // Recent activities
        List<ComplianceDashboardResponse.RecentComplianceActivity> recentActivities = 
            assignedApplications.stream()
                .limit(5)
                .map(this::mapToRecentActivity)
                .collect(Collectors.toList());
        
        return ComplianceDashboardResponse.builder()
            .officerId(complianceOfficer.getId())
            .officerName(officerProfileService.getOfficerDisplayName(complianceOfficer)) // ✅ FIXED: Using proper name resolution
            .officerEmail(complianceOfficer.getEmail())
            .role(complianceOfficer.getRole().name())
            .totalAssignedApplications(totalAssigned)
            .flaggedForCompliance(flaggedForCompliance)
            .underComplianceReview(underReview)
            .pendingComplianceDocs(pendingDocs)
            .criticalPriorityApplications(criticalPriority)
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
        application.setComplianceNotes(application.getComplianceNotes() + " | CLEARED: " + request.getDecisionNotes());
        application.setUpdatedAt(LocalDateTime.now());
        
        // Clear compliance officer assignment (return to loan officer)
        application.setAssignedComplianceOfficer(null);
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, newStatus, complianceOfficer, 
            "Compliance cleared: " + request.getDecisionNotes());
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_CLEARED", "LoanApplication", null,
            "Application cleared from compliance review. Reason: " + request.getDecisionNotes());
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(complianceOfficer.getEmail())
            .decisionType(ComplianceDecisionRequest.ComplianceDecisionType.CLEARED)
            .newStatus(newStatus)
            .previousStatus(previousStatus)
            .decisionNotes(request.getDecisionNotes())
            .additionalNotes(request.getAdditionalNotes())
            .processedAt(LocalDateTime.now())
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
        application.setComplianceNotes(application.getComplianceNotes() + " | REJECTED: " + request.getDecisionNotes());
        application.setFinalDecisionAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        workflowService.createWorkflowEntry(applicationId, previousStatus, newStatus, complianceOfficer, 
            "Rejected for compliance violation: " + request.getDecisionNotes());
        
        // Log audit event
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_VIOLATION_REJECTED", "LoanApplication", null,
            String.format("Application rejected for compliance violation. Type: %s. Reason: %s", 
                request.getComplianceViolationType(), request.getDecisionNotes()));
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(complianceOfficer.getEmail())
            .decisionType(ComplianceDecisionRequest.ComplianceDecisionType.REJECTED)
            .newStatus(newStatus)
            .previousStatus(previousStatus)
            .decisionNotes(request.getDecisionNotes())
            .additionalNotes(request.getAdditionalNotes())
            .processedAt(LocalDateTime.now())
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
            .applicantName(profileCompletionService.getDisplayName(application.getApplicant())) // ✅ FIXED: Using proper name resolution
            .action("Compliance Review")
            .status(application.getStatus().name())
            .flagReason(extractFlagReason(application.getComplianceNotes()))
            .priority(application.getPriority() != null ? application.getPriority().name() : "LOW") // ✅ FIXED: Using Priority enum
            .timestamp(application.getUpdatedAt())
            .description("Application under compliance review")
            .build();
    }
    
    private String extractFlagReason(String complianceNotes) {
        if (complianceNotes == null) return "Not specified";
        // Extract flag reason from compliance notes (simple implementation)
        return complianceNotes.length() > 50 ? complianceNotes.substring(0, 50) + "..." : complianceNotes;
    }
    
    // Removed extractPriority method - now using Priority enum directly
    
    @Override
    public ComplianceInvestigationResponse performComprehensiveInvestigation(UUID applicationId, User complianceOfficer) {
        log.info("Performing comprehensive compliance investigation for application: {} by officer: {}", 
                applicationId, complianceOfficer.getEmail());
        
        // Validate compliance officer authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to investigate this application");
        }
        
        // Get the loan application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found with ID: " + applicationId));
        
        // Get applicant's personal details to extract Aadhaar and PAN
        String aadhaarNumber = null;
        String panNumber = null;
        
        // Find personal details by user ID
        var personalDetailsOpt = personalDetailsRepository.findByUserId(application.getApplicant().getId());
        if (personalDetailsOpt.isPresent()) {
            var personalDetails = personalDetailsOpt.get();
            aadhaarNumber = personalDetails.getAadhaarNumber();
            panNumber = personalDetails.getPanNumber();
        }
        
        // Validate required data
        if (aadhaarNumber == null || panNumber == null) {
            throw new LoanApiException("Applicant's Aadhaar and PAN details are required for compliance investigation");
        }
        
        try {
            // Execute the comprehensive compliance investigation stored procedure
            String investigationResultJson = complianceInvestigationRepository
                .executeComprehensiveInvestigation(aadhaarNumber, panNumber);
            
            // Parse the JSON response from stored procedure using global ObjectMapper
            ComplianceInvestigationResponse response = objectMapper.readValue(
                investigationResultJson, ComplianceInvestigationResponse.class);
            
            // Log the investigation
            auditLogService.logAction(complianceOfficer, "COMPLIANCE_INVESTIGATION_PERFORMED", 
                "LoanApplication", null,
                String.format("Comprehensive compliance investigation performed for application %s. " +
                             "Overall Risk: %s, Investigation ID: %s", 
                             applicationId, 
                             response.getOverallAssessment().get("finalRiskLevel").asText(),
                             response.getInvestigationId()));
            
            log.info("Compliance investigation completed successfully for application: {} with investigation ID: {}", 
                    applicationId, response.getInvestigationId());
            
            return response;
            
        } catch (Exception e) {
            log.error("Failed to perform compliance investigation for application {}: {}", applicationId, e.getMessage());
            throw new LoanApiException("Failed to perform compliance investigation: " + e.getMessage());
        }
    }
    
    private int getMaxCapacity(User complianceOfficer) {
        return complianceOfficer.getRole() == RoleType.SENIOR_COMPLIANCE_OFFICER ? 15 : 10;
    }
    
    @Override
    public ComplianceDecisionResponse quickClearCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer) {
        log.info("Quick clearing compliance for application: {} by officer: {}", applicationId, complianceOfficer.getEmail());
        
        // Validate compliance authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to clear this application");
        }
        
        // Get the loan application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Validate current status
        if (application.getStatus() != ApplicationStatus.FLAGGED_FOR_COMPLIANCE) {
            throw new LoanApiException("Application must be in FLAGGED_FOR_COMPLIANCE status for quick clear. Current status: " + application.getStatus());
        }
        
        // Update application status to READY_FOR_DECISION
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.READY_FOR_DECISION);
        application.setComplianceNotes(request.getDecisionNotes());
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Record workflow transition
        workflowService.createWorkflowEntry(savedApplication.getId(), oldStatus, ApplicationStatus.READY_FOR_DECISION, 
            complianceOfficer, "Quick compliance clearance: " + request.getDecisionNotes());
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_QUICK_CLEARED", "LoanApplication", savedApplication.getId().hashCode() & 0x7FFFFFFFL,
            String.format("Quick cleared application %s for compliance. Reason: %s", applicationId, request.getDecisionNotes()));
        
        log.info("Application {} quick cleared for compliance by officer: {}", applicationId, complianceOfficer.getEmail());
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .decision("QUICK_CLEARED")
            .newStatus(ApplicationStatus.READY_FOR_DECISION)
            .decisionNotes(request.getDecisionNotes())
            .processedBy(complianceOfficer.getEmail())
            .processedAt(LocalDateTime.now())
            .nextSteps("Application returned to normal processing workflow for final decision")
            .build();
    }
    
    @Override
    public ComplianceDecisionResponse quickRejectCompliance(UUID applicationId, ComplianceDecisionRequest request, User complianceOfficer) {
        log.info("Quick rejecting compliance for application: {} by officer: {}", applicationId, complianceOfficer.getEmail());
        
        // Validate compliance authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to reject this application");
        }
        
        // Get the loan application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Validate current status
        if (application.getStatus() != ApplicationStatus.FLAGGED_FOR_COMPLIANCE) {
            throw new LoanApiException("Application must be in FLAGGED_FOR_COMPLIANCE status for quick reject. Current status: " + application.getStatus());
        }
        
        // Update application status to REJECTED
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.REJECTED);
        application.setComplianceNotes(request.getDecisionNotes());
        application.setRejectionReason("Compliance violation: " + request.getDecisionNotes());
        application.setFinalDecisionAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Record workflow transition
        workflowService.createWorkflowEntry(savedApplication.getId(), oldStatus, ApplicationStatus.REJECTED, 
            complianceOfficer, "Quick compliance rejection: " + request.getDecisionNotes());
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_QUICK_REJECTED", "LoanApplication", savedApplication.getId().hashCode() & 0x7FFFFFFFL,
            String.format("Quick rejected application %s for compliance violation. Reason: %s", applicationId, request.getDecisionNotes()));
        
        log.info("Application {} quick rejected for compliance by officer: {}", applicationId, complianceOfficer.getEmail());
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .decision("QUICK_REJECTED")
            .newStatus(ApplicationStatus.REJECTED)
            .decisionNotes(request.getDecisionNotes())
            .processedBy(complianceOfficer.getEmail())
            .processedAt(LocalDateTime.now())
            .nextSteps("Application rejected due to compliance violation. Process complete.")
            .build();
    }
    
    @Override
    public void handleDocumentSubmission(UUID applicationId, User complianceOfficer) {
        log.info("Handling document submission for application: {} by officer: {}", applicationId, complianceOfficer.getEmail());
        
        // Validate compliance authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to handle documents for this application");
        }
        
        // Get the loan application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Validate current status
        if (application.getStatus() != ApplicationStatus.PENDING_COMPLIANCE_DOCS) {
            throw new LoanApiException("Application must be in PENDING_COMPLIANCE_DOCS status. Current status: " + application.getStatus());
        }
        
        // Update application status back to COMPLIANCE_REVIEW
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.COMPLIANCE_REVIEW);
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Record workflow transition
        workflowService.createWorkflowEntry(savedApplication.getId(), oldStatus, ApplicationStatus.COMPLIANCE_REVIEW, 
            complianceOfficer, "Documents received - returning to compliance review");
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_DOCUMENTS_RECEIVED", "LoanApplication", savedApplication.getId().hashCode() & 0x7FFFFFFFL,
            String.format("Documents received for application %s, returned to compliance review", applicationId));
        
        log.info("Documents received for application {} by officer: {}", applicationId, complianceOfficer.getEmail());
    }
    
    @Override
    public void processComplianceTimeout(UUID applicationId, User complianceOfficer) {
        log.info("Processing compliance timeout for application: {} by officer: {}", applicationId, complianceOfficer.getEmail());
        
        // Validate compliance authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to process timeout for this application");
        }
        
        // Get the loan application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Validate current status
        if (application.getStatus() != ApplicationStatus.PENDING_COMPLIANCE_DOCS) {
            throw new LoanApiException("Application must be in PENDING_COMPLIANCE_DOCS status. Current status: " + application.getStatus());
        }
        
        // Check if 7 days have passed (this would typically be called by a scheduled job)
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        if (application.getUpdatedAt().isAfter(sevenDaysAgo)) {
            throw new LoanApiException("Cannot process timeout - 7 days have not passed since document request");
        }
        
        // Update application status to COMPLIANCE_TIMEOUT
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.COMPLIANCE_TIMEOUT);
        application.setComplianceNotes("Timeout: No response to compliance document request within 7 days");
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Record workflow transition
        workflowService.createWorkflowEntry(savedApplication.getId(), oldStatus, ApplicationStatus.COMPLIANCE_TIMEOUT, 
            complianceOfficer, "Compliance document request timeout - 7 days no response");
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_TIMEOUT_PROCESSED", "LoanApplication", savedApplication.getId().hashCode() & 0x7FFFFFFFL,
            String.format("Compliance timeout processed for application %s - no response within 7 days", applicationId));
        
        log.info("Compliance timeout processed for application {} by officer: {}", applicationId, complianceOfficer.getEmail());
    }
}
