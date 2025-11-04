package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
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
import com.tss.loan.repository.ComplianceDocumentRequestRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.LoanDocumentRepository;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.service.ApplicationAssignmentService;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.ComplianceOfficerService;
import com.tss.loan.service.EmailService;
import com.tss.loan.service.LoanOfficerService;
import com.tss.loan.service.NotificationService;
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
    private com.tss.loan.repository.external.ComplianceInvestigationRepository externalComplianceInvestigationRepository;
    
    @Autowired
    @org.springframework.beans.factory.annotation.Qualifier("complianceInvestigationStorageRepository")
    private com.tss.loan.repository.ComplianceInvestigationRepository complianceInvestigationRepository;
    
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
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private ComplianceDocumentRequestRepository complianceDocumentRequestRepository;
    
    @Autowired
    private LoanDocumentRepository loanDocumentRepository;
    
    @Autowired
    private NotificationService notificationService;
    
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
        
        // Get all assigned applications, but exclude READY_FOR_DECISION status
        // (compliance can't do anything after submitting decision)
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer)
            .stream()
            .filter(app -> app.getStatus() != ApplicationStatus.READY_FOR_DECISION)
            .collect(Collectors.toList());
        
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
        
        // Check if there are pending compliance documents that haven't been verified/rejected
        List<com.tss.loan.entity.compliance.ComplianceDocumentRequest> pendingRequests = 
            complianceDocumentRequestRepository.findPendingRequestsByApplicationId(applicationId);
        
        if (!pendingRequests.isEmpty()) {
            // Check if there are any unverified compliance-only documents
            List<com.tss.loan.entity.loan.LoanDocument> complianceDocs = 
                application.getDocuments() != null ? application.getDocuments().stream()
                    .filter(doc -> doc.getVerificationNotes() != null && doc.getVerificationNotes().contains("[COMPLIANCE_ONLY]"))
                    .filter(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.PENDING)
                    .collect(java.util.stream.Collectors.toList()) : java.util.Collections.emptyList();
            
            if (!complianceDocs.isEmpty()) {
                throw new LoanApiException("Cannot request new documents. Please verify or reject pending compliance documents first.");
            }
        }
        
        // Update status
        ApplicationStatus previousStatus = application.getStatus();
        application.setStatus(ApplicationStatus.PENDING_COMPLIANCE_DOCS);
        application.setComplianceNotes(application.getComplianceNotes() + " | Document Request: " + request.getRequestReason());
        application.setUpdatedAt(LocalDateTime.now());
        
        loanApplicationRepository.save(application);
        
        // Save compliance document request to database
        try {
            com.tss.loan.entity.compliance.ComplianceDocumentRequest complianceRequestEntity = 
                new com.tss.loan.entity.compliance.ComplianceDocumentRequest();
            complianceRequestEntity.setLoanApplication(application);
            complianceRequestEntity.setRequestedBy(complianceOfficer);
            
            // Convert document types list to JSON string
            String documentTypesJson = objectMapper.writeValueAsString(request.getRequiredDocumentTypes());
            complianceRequestEntity.setRequiredDocumentTypes(documentTypesJson);
            
            complianceRequestEntity.setRequestReason(request.getRequestReason());
            complianceRequestEntity.setAdditionalInstructions(request.getAdditionalInstructions());
            complianceRequestEntity.setDeadlineDays(request.getDeadlineDays());
            complianceRequestEntity.setPriorityLevel(request.getPriorityLevel());
            complianceRequestEntity.setIsMandatory(request.isMandatory());
            complianceRequestEntity.setComplianceCategory(request.getComplianceCategory());
            complianceRequestEntity.setStatus("PENDING");
            
            complianceDocumentRequestRepository.save(complianceRequestEntity);
            log.info("Compliance document request saved to database with ID: {}", complianceRequestEntity.getId());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize document types to JSON: {}", e.getMessage(), e);
            throw new LoanApiException("Failed to save compliance document request: " + e.getMessage());
        } catch (Exception e) {
            log.error("Failed to save compliance document request to database: {}", e.getMessage(), e);
            throw new LoanApiException("Failed to save compliance document request: " + e.getMessage());
        }
        
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
        
        // Notify applicant
        try {
            notificationService.createNotification(
                application.getApplicant(),
                NotificationType.IN_APP,
                "Compliance Review Completed",
                "Your application has been cleared from compliance review and is proceeding to final decision."
            );
            
            emailService.sendLoanStatusEmail(
                application.getApplicant().getEmail(),
                "COMPLIANCE_CLEARED",
                applicationId.toString(),
                application.getApplicant()
            );
        } catch (Exception e) {
            log.error("Failed to notify applicant", e);
        }
        
        // Notify loan officer
        try {
            if (application.getAssignedOfficer() != null) {
                notificationService.createNotification(
                    application.getAssignedOfficer(),
                    NotificationType.IN_APP,
                    "Application Cleared from Compliance",
                    String.format("Application %s has been cleared from compliance review and is ready for your decision.", applicationId)
                );
                
                emailService.sendLoanStatusEmail(
                    application.getAssignedOfficer().getEmail(),
                    "READY_FOR_DECISION",
                    applicationId.toString(),
                    application.getAssignedOfficer()
                );
            }
        } catch (Exception e) {
            log.error("Failed to notify loan officer", e);
        }
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(officerProfileService.getOfficerDisplayName(complianceOfficer))
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
        
        // Notify applicant
        try {
            notificationService.createNotification(
                application.getApplicant(),
                NotificationType.IN_APP,
                "Application Rejected - Compliance Violation",
                "We regret to inform you that your application has been rejected due to compliance requirements."
            );
            
            emailService.sendLoanStatusEmail(
                application.getApplicant().getEmail(),
                "COMPLIANCE_REJECTED",
                applicationId.toString(),
                application.getApplicant()
            );
        } catch (Exception e) {
            log.error("Failed to notify applicant", e);
        }
        
        return ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(officerProfileService.getOfficerDisplayName(complianceOfficer))
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
            // Update application status to UNDER_INVESTIGATION
            ApplicationStatus previousStatus = application.getStatus();
            application.setStatus(ApplicationStatus.UNDER_INVESTIGATION);
            application.setUpdatedAt(LocalDateTime.now());
            loanApplicationRepository.save(application);
            
            // Log workflow transition
            workflowService.createWorkflowEntry(applicationId, previousStatus, ApplicationStatus.UNDER_INVESTIGATION, 
                complianceOfficer, "Comprehensive compliance investigation started");
            
            // Execute the comprehensive compliance investigation stored procedure
            String investigationResultJson = externalComplianceInvestigationRepository
                .executeComprehensiveInvestigation(aadhaarNumber, panNumber);
            
            // Parse the JSON response from stored procedure using global ObjectMapper
            ComplianceInvestigationResponse response = objectMapper.readValue(
                investigationResultJson, ComplianceInvestigationResponse.class);
            
            // Save investigation results to database for later retrieval
            try {
                com.tss.loan.entity.compliance.ComplianceInvestigation investigationEntity = 
                    new com.tss.loan.entity.compliance.ComplianceInvestigation();
                investigationEntity.setLoanApplication(application);
                investigationEntity.setInvestigatedBy(complianceOfficer);
                investigationEntity.setInvestigationId(response.getInvestigationId());
                investigationEntity.setInvestigationData(investigationResultJson); // Store full JSON
                investigationEntity.setInvestigationDate(response.getInvestigationDate());
                
                complianceInvestigationRepository.save(investigationEntity);
                log.info("Investigation results saved to database with ID: {} for application: {}", 
                    investigationEntity.getId(), applicationId);
            } catch (Exception e) {
                log.error("Failed to save investigation results to database for application {}: {}", 
                    applicationId, e.getMessage());
                // Don't fail the investigation if database save fails
            }
            
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
            .processedBy(officerProfileService.getOfficerDisplayName(complianceOfficer))
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
            .processedBy(officerProfileService.getOfficerDisplayName(complianceOfficer))
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
        
        // Update application status to UNDER_INVESTIGATION when compliance receives documents
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.UNDER_INVESTIGATION);
        application.setUpdatedAt(LocalDateTime.now());
        
        LoanApplication savedApplication = loanApplicationRepository.save(application);
        
        // Record workflow transition
        workflowService.createWorkflowEntry(savedApplication.getId(), oldStatus, ApplicationStatus.UNDER_INVESTIGATION, 
            complianceOfficer, "Documents received from applicant - moving to investigation");
        
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
    
    @Override
    public void trackDocumentView(Long documentId, User complianceOfficer) {
        log.info("Compliance officer {} viewing document: {}", complianceOfficer.getEmail(), documentId);
        
        com.tss.loan.entity.loan.LoanDocument document = loanDocumentRepository.findById(documentId)
            .orElseThrow(() -> new LoanApiException("Document not found: " + documentId));
        
        // Verify this is a compliance-only document
        if (document.getVerificationNotes() == null || !document.getVerificationNotes().contains("[COMPLIANCE_ONLY]")) {
            throw new LoanApiException("This document is not a compliance-requested document");
        }
        
        // Track the view
        document.setViewedByComplianceAt(LocalDateTime.now());
        loanDocumentRepository.save(document);
        
        log.info("Document view tracked for document: {} by officer: {}", documentId, complianceOfficer.getEmail());
    }
    
    @Override
    public void verifyComplianceDocument(Long documentId, boolean verified, String notes, String rejectionReason, User complianceOfficer) {
        log.info("Compliance officer {} verifying document: {} as {}", complianceOfficer.getEmail(), documentId, verified ? "VERIFIED" : "REJECTED");
        
        com.tss.loan.entity.loan.LoanDocument document = loanDocumentRepository.findById(documentId)
            .orElseThrow(() -> new LoanApiException("Document not found: " + documentId));
        
        // Verify this is a compliance-only document by checking if document type matches requested types
        // Get the compliance document request to check if this document type was requested
        UUID applicationId = document.getLoanApplication().getId();
        java.util.Optional<com.tss.loan.entity.compliance.ComplianceDocumentRequest> requestOpt = 
            complianceDocumentRequestRepository.findMostRecentPendingRequest(applicationId);
        
        boolean isComplianceDoc = false;
        if (requestOpt.isPresent()) {
            com.tss.loan.entity.compliance.ComplianceDocumentRequest request = requestOpt.get();
            try {
                List<String> requestedTypes = objectMapper.readValue(
                    request.getRequiredDocumentTypes(),
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
                );
                String docType = document.getDocumentType().toString();
                isComplianceDoc = requestedTypes.contains(docType);
            } catch (Exception e) {
                log.warn("Failed to parse requested document types for validation: {}", e.getMessage());
            }
        }
        
        // Fallback: check verificationNotes for [COMPLIANCE_ONLY] tag
        if (!isComplianceDoc && (document.getVerificationNotes() == null || !document.getVerificationNotes().contains("[COMPLIANCE_ONLY]"))) {
            throw new LoanApiException("This document is not a compliance-requested document");
        }
        
        // Update verification status
        // Preserve [COMPLIANCE_ONLY] tag in verificationNotes to maintain compliance document identification
        String originalNotes = document.getVerificationNotes();
        boolean hasComplianceTag = originalNotes != null && originalNotes.contains("[COMPLIANCE_ONLY]");
        
        if (verified) {
            document.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.VERIFIED);
            String newNotes = notes != null ? notes : "Verified by compliance officer";
            // Preserve [COMPLIANCE_ONLY] tag if it existed
            if (hasComplianceTag && !newNotes.contains("[COMPLIANCE_ONLY]")) {
                document.setVerificationNotes("[COMPLIANCE_ONLY] " + newNotes);
            } else {
                document.setVerificationNotes(newNotes);
            }
        } else {
            document.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.REJECTED);
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new LoanApiException("Rejection reason is required when rejecting a document");
            }
            // Preserve [COMPLIANCE_ONLY] tag if it existed
            if (hasComplianceTag && !rejectionReason.contains("[COMPLIANCE_ONLY]")) {
                document.setVerificationNotes("[COMPLIANCE_ONLY] " + rejectionReason);
            } else {
                document.setVerificationNotes(rejectionReason);
            }
        }
        
        document.setVerifiedAt(LocalDateTime.now());
        document.setVerifiedBy(complianceOfficer);
        loanDocumentRepository.save(document);
        
        // Get application for status updates and notifications
        LoanApplication application = document.getLoanApplication();
        
        // Send notifications to applicant (both EMAIL and IN_APP)
        if (verified) {
            String notificationMessage = String.format("Your %s document has been verified by the compliance officer. %s", 
                document.getDocumentType().toString(),
                notes != null && !notes.trim().isEmpty() ? "Notes: " + notes : "");
            
            // Send email notification
            notificationService.createNotification(
                application.getApplicant(),
                com.tss.loan.entity.enums.NotificationType.EMAIL,
                "Document Verified",
                notificationMessage
            );
            
            // Send in-app notification
            notificationService.createNotification(
                application.getApplicant(),
                com.tss.loan.entity.enums.NotificationType.IN_APP,
                "Document Verified",
                notificationMessage
            );
        } else {
            String notificationMessage = String.format("Your %s document has been rejected by the compliance officer. Reason: %s. Please resubmit the document.", 
                document.getDocumentType().toString(),
                rejectionReason);
            
            // Send email notification
            notificationService.createNotification(
                application.getApplicant(),
                com.tss.loan.entity.enums.NotificationType.EMAIL,
                "Document Rejected",
                notificationMessage
            );
            
            // Send in-app notification
            notificationService.createNotification(
                application.getApplicant(),
                com.tss.loan.entity.enums.NotificationType.IN_APP,
                "Document Rejected",
                notificationMessage
            );
            
            // If document is rejected, change application status back to PENDING_COMPLIANCE_DOCS
            // This allows compliance to request the same document again or different documents
            if (application.getStatus() == ApplicationStatus.UNDER_INVESTIGATION) {
                ApplicationStatus oldStatus = application.getStatus();
                application.setStatus(ApplicationStatus.PENDING_COMPLIANCE_DOCS);
                application.setUpdatedAt(LocalDateTime.now());
                loanApplicationRepository.save(application);
                
                // Log workflow
                workflowService.createWorkflowEntry(applicationId, oldStatus, ApplicationStatus.PENDING_COMPLIANCE_DOCS, 
                    complianceOfficer, "Document rejected - applicant can resubmit documents");
                
                log.info("Application status changed from {} to {} due to document rejection", oldStatus, ApplicationStatus.PENDING_COMPLIANCE_DOCS);
            }
        }
        
        // Check if all compliance documents for this application are verified/rejected
        // Use the same applicationId variable from earlier in the method
        List<com.tss.loan.entity.loan.LoanDocument> allComplianceDocs = loanDocumentRepository.findByLoanApplicationId(applicationId)
            .stream()
            .filter(doc -> {
                // Check if document type matches requested types OR has [COMPLIANCE_ONLY] tag
                if (doc.getVerificationNotes() != null && doc.getVerificationNotes().contains("[COMPLIANCE_ONLY]")) {
                    return true;
                }
                // Check against requested document types
                if (requestOpt.isPresent()) {
                    try {
                        com.tss.loan.entity.compliance.ComplianceDocumentRequest req = requestOpt.get();
                        List<String> requestedTypes = objectMapper.readValue(
                            req.getRequiredDocumentTypes(),
                            new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
                        );
                        return requestedTypes.contains(doc.getDocumentType().toString());
                    } catch (Exception e) {
                        // Fallback to tag check
                        return false;
                    }
                }
                return false;
            })
            .collect(java.util.stream.Collectors.toList());
        
        boolean allProcessed = allComplianceDocs.stream()
            .allMatch(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED 
                || doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.REJECTED);
        
        if (allProcessed) {
            // Update compliance request status to RECEIVED if all documents processed
            if (requestOpt.isPresent()) {
                com.tss.loan.entity.compliance.ComplianceDocumentRequest pendingRequest = requestOpt.get();
                pendingRequest.setStatus("RECEIVED");
                pendingRequest.setFulfilledAt(LocalDateTime.now());
                complianceDocumentRequestRepository.save(pendingRequest);
                
                // Update application status to UNDER_INVESTIGATION when all compliance documents are processed
                // Use the application variable already defined above
                if (application.getStatus() == ApplicationStatus.PENDING_COMPLIANCE_DOCS) {
                    ApplicationStatus oldStatusForTransition = application.getStatus();
                    application.setStatus(ApplicationStatus.UNDER_INVESTIGATION);
                    application.setUpdatedAt(LocalDateTime.now());
                    loanApplicationRepository.save(application);
                    
                    // Log workflow
                    workflowService.createWorkflowEntry(applicationId, oldStatusForTransition, 
                        ApplicationStatus.UNDER_INVESTIGATION, complianceOfficer, "All compliance documents processed - moving to investigation");
                }
            }
        }
        
        // Audit log
        auditLogService.logAction(complianceOfficer, verified ? "COMPLIANCE_DOCUMENT_VERIFIED" : "COMPLIANCE_DOCUMENT_REJECTED", 
            "LoanDocument", documentId.hashCode() & 0x7FFFFFFFL,
            String.format("Document %s %s by compliance officer. %s", documentId, verified ? "verified" : "rejected", 
                verified ? (notes != null ? notes : "") : rejectionReason));
        
        log.info("Document {} {} by officer: {}", documentId, verified ? "verified" : "rejected", complianceOfficer.getEmail());
    }
    
    @Override
    public com.tss.loan.dto.response.ComplianceDocumentRequestDetailsResponse getComplianceDocumentRequestDetails(UUID applicationId, User complianceOfficer) {
        log.info("Compliance officer {} requesting compliance document request details for application: {}", complianceOfficer.getEmail(), applicationId);
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to view this application");
        }
        
        // Find the most recent compliance document request (pending or received)
        // Try to find any request first (not just PENDING) to get all data
        List<com.tss.loan.entity.compliance.ComplianceDocumentRequest> allRequests = 
            complianceDocumentRequestRepository.findByLoanApplicationIdOrderByRequestedAtDesc(applicationId);
        
        java.util.Optional<com.tss.loan.entity.compliance.ComplianceDocumentRequest> requestOpt = java.util.Optional.empty();
        
        if (!allRequests.isEmpty()) {
            // Get the most recent request (prefer PENDING, but take any if available)
            requestOpt = allRequests.stream()
                .filter(req -> "PENDING".equals(req.getStatus()) || "RECEIVED".equals(req.getStatus()))
                .findFirst();
            
            // If no PENDING/RECEIVED, just take the most recent one
            if (!requestOpt.isPresent()) {
                requestOpt = java.util.Optional.of(allRequests.get(0));
            }
        }
        
        if (!requestOpt.isPresent()) {
            // No compliance document request found - return empty response
            log.warn("No compliance document request found for application: {}", applicationId);
            return com.tss.loan.dto.response.ComplianceDocumentRequestDetailsResponse.builder()
                .requiredDocumentTypes(java.util.Collections.emptyList())
                .status("NONE")
                .build();
        }
        
        com.tss.loan.entity.compliance.ComplianceDocumentRequest request = requestOpt.get();
        
        // Re-fetch by ID to ensure we get fresh data from database (handles potential caching issues)
        Long requestId = request.getId();
        com.tss.loan.entity.compliance.ComplianceDocumentRequest freshRequest = 
            complianceDocumentRequestRepository.findById(requestId)
                .orElse(request); // Fallback to original if not found
        
        // Try to get requiredDocumentTypes directly from database using native query
        // This bypasses any potential JPA mapping issues with JSON columns
        String requiredDocumentTypesJson = freshRequest.getRequiredDocumentTypes();
        if (requiredDocumentTypesJson == null || requiredDocumentTypesJson.trim().isEmpty()) {
            // Try native query as fallback
            try {
                String nativeResult = complianceDocumentRequestRepository.getRequiredDocumentTypesById(requestId);
                if (nativeResult != null && !nativeResult.trim().isEmpty()) {
                    requiredDocumentTypesJson = nativeResult;
                    log.info("Retrieved requiredDocumentTypes via native query: '{}'", requiredDocumentTypesJson);
                }
            } catch (Exception e) {
                log.warn("Failed to fetch requiredDocumentTypes via native query: {}", e.getMessage());
            }
        }
        
        // Log the raw data from database for debugging
        log.info("Retrieved compliance document request - ID: {}, Status: {}, RequiredDocumentTypes (raw): '{}'", 
            freshRequest.getId(), freshRequest.getStatus(), requiredDocumentTypesJson);
        
        // Use the fresh request
        request = freshRequest;
        
        // Parse document types from JSON
        List<String> documentTypes = java.util.Collections.emptyList();
        
        if (requiredDocumentTypesJson != null && !requiredDocumentTypesJson.trim().isEmpty()) {
            try {
                List<String> parsed = objectMapper.readValue(
                    requiredDocumentTypesJson,
                    new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {}
                );
                // Ensure parsed result is not null
                documentTypes = (parsed != null) ? parsed : java.util.Collections.emptyList();
                log.info("Successfully parsed {} document types: {}", documentTypes.size(), documentTypes);
            } catch (Exception e) {
                log.error("Failed to parse document types JSON: '{}'. Error: {}", requiredDocumentTypesJson, e.getMessage(), e);
                documentTypes = java.util.Collections.emptyList();
            }
        } else {
            log.warn("RequiredDocumentTypes is null or empty for request ID: {}. Raw value: '{}'", 
                request.getId(), requiredDocumentTypesJson);
        }
        
        // Ensure documentTypes is never null
        if (documentTypes == null) {
            documentTypes = java.util.Collections.emptyList();
        }
        
        return com.tss.loan.dto.response.ComplianceDocumentRequestDetailsResponse.builder()
            .requestId(request.getId())
            .requiredDocumentTypes(documentTypes)
            .requestReason(request.getRequestReason())
            .additionalInstructions(request.getAdditionalInstructions())
            .requestedAt(request.getRequestedAt())
            .status(request.getStatus())
            .deadlineDays(request.getDeadlineDays())
            .priorityLevel(request.getPriorityLevel())
            .isMandatory(request.getIsMandatory())
            .complianceCategory(request.getComplianceCategory())
            .build();
    }
    
    @Override
    public void triggerDecision(UUID applicationId, com.tss.loan.dto.request.ComplianceTriggerDecisionRequest request, User complianceOfficer) {
        log.info("Compliance officer {} triggering decision for application: {}", complianceOfficer.getEmail(), applicationId);
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to trigger decision for this application");
        }
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Only allow triggering decision from UNDER_INVESTIGATION status
        if (application.getStatus() != ApplicationStatus.UNDER_INVESTIGATION) {
            throw new LoanApiException("Application must be in UNDER_INVESTIGATION status to trigger decision. Current status: " + application.getStatus());
        }
        
        // Check if there are pending compliance documents that need verification
        if (hasPendingComplianceDocuments(applicationId)) {
            throw new LoanApiException("Cannot trigger decision. Please verify or reject all pending compliance documents first.");
        }
        
        // Update status to AWAITING_COMPLIANCE_DECISION
        ApplicationStatus oldStatus = application.getStatus();
        application.setStatus(ApplicationStatus.AWAITING_COMPLIANCE_DECISION);
        application.setComplianceNotes((application.getComplianceNotes() != null ? application.getComplianceNotes() + " | " : "") + 
            "Decision Triggered: " + request.getSummaryNotes());
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Log workflow
        workflowService.createWorkflowEntry(applicationId, oldStatus, ApplicationStatus.AWAITING_COMPLIANCE_DECISION, 
            complianceOfficer, "Compliance decision triggered: " + request.getSummaryNotes());
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_DECISION_TRIGGERED", "LoanApplication", 
            applicationId.hashCode() & 0x7FFFFFFFL,
            "Compliance decision triggered for application: " + applicationId + ". Summary: " + request.getSummaryNotes());
        
        log.info("Decision triggered for application: {} by compliance officer: {}", applicationId, complianceOfficer.getEmail());
    }
    
    @Override
    public List<LoanApplicationResponse> getApplicationsAwaitingDecision(User complianceOfficer) {
        log.info("Getting applications awaiting compliance decision for officer: {}", complianceOfficer.getEmail());
        
        // Get applications in AWAITING_COMPLIANCE_DECISION status assigned to this compliance officer
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerAndStatus(complianceOfficer, ApplicationStatus.AWAITING_COMPLIANCE_DECISION);
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(java.util.stream.Collectors.toList());
    }
    
    @Override
    public com.tss.loan.dto.response.ComplianceDecisionResponse submitComplianceDecision(UUID applicationId, 
            com.tss.loan.dto.request.ComplianceSubmitDecisionRequest request, User complianceOfficer) {
        log.info("Compliance officer {} submitting decision for application: {} - Decision: {}", 
            complianceOfficer.getEmail(), applicationId, request.getDecision());
        
        // Verify authority
        if (!hasComplianceAuthority(applicationId, complianceOfficer)) {
            throw new LoanApiException("You do not have authority to submit decision for this application");
        }
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Only allow from AWAITING_COMPLIANCE_DECISION status
        if (application.getStatus() != ApplicationStatus.AWAITING_COMPLIANCE_DECISION) {
            throw new LoanApiException("Application must be in AWAITING_COMPLIANCE_DECISION status. Current status: " + application.getStatus());
        }
        
        // Validate decision
        if (!"APPROVE".equalsIgnoreCase(request.getDecision()) && !"REJECT".equalsIgnoreCase(request.getDecision())) {
            throw new LoanApiException("Decision must be either 'APPROVE' or 'REJECT'");
        }
        
        boolean isApproved = "APPROVE".equalsIgnoreCase(request.getDecision());
        ApplicationStatus oldStatus = application.getStatus();
        
        // Update application with compliance decision notes (these go to loan officer)
        application.setComplianceNotes((application.getComplianceNotes() != null ? application.getComplianceNotes() + " | " : "") + 
            "Compliance Decision: " + request.getDecision() + " - Notes to Loan Officer: " + request.getNotesToLoanOfficer());
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Status changes to READY_FOR_DECISION so loan officer can make final decision
        application.setStatus(ApplicationStatus.READY_FOR_DECISION);
        loanApplicationRepository.save(application);
        
        // Log workflow
        workflowService.createWorkflowEntry(applicationId, oldStatus, ApplicationStatus.READY_FOR_DECISION, 
            complianceOfficer, "Compliance decision submitted: " + request.getDecision() + ". Notes: " + request.getNotesToLoanOfficer());
        
        // Retrieve investigation results to include in decision response
        String investigationData = null;
        try {
            var investigationOpt = complianceInvestigationRepository.findMostRecentByApplicationId(applicationId);
            if (investigationOpt.isPresent()) {
                investigationData = investigationOpt.get().getInvestigationData();
                log.info("Retrieved investigation data for application: {}", applicationId);
            }
        } catch (Exception e) {
            log.warn("Failed to retrieve investigation data for application {}: {}", applicationId, e.getMessage());
        }
        
        // Notify loan officer about compliance decision (with investigation data reference)
        String notificationMessage = String.format(
            "Compliance officer has submitted %s decision for application %s. Notes: %s", 
            request.getDecision(), applicationId, request.getNotesToLoanOfficer());
        
        if (application.getAssignedOfficer() != null) {
            notificationService.createNotification(
                application.getAssignedOfficer(),
                com.tss.loan.entity.enums.NotificationType.IN_APP,
                "Compliance Decision Submitted",
                notificationMessage
            );
            
            notificationService.createNotification(
                application.getAssignedOfficer(),
                com.tss.loan.entity.enums.NotificationType.EMAIL,
                "Compliance Decision Submitted",
                String.format("Compliance officer has submitted %s decision for application %s. Please review and make final decision. Notes: %s", 
                    request.getDecision(), applicationId, request.getNotesToLoanOfficer())
            );
        }
        
        // Audit log
        auditLogService.logAction(complianceOfficer, "COMPLIANCE_DECISION_SUBMITTED", "LoanApplication", 
            applicationId.hashCode() & 0x7FFFFFFFL,
            String.format("Compliance decision submitted: %s for application: %s. Notes: %s", 
                request.getDecision(), applicationId, request.getNotesToLoanOfficer()));
        
        log.info("Compliance decision submitted for application: {} - Decision: {}", applicationId, request.getDecision());
        
        return com.tss.loan.dto.response.ComplianceDecisionResponse.builder()
            .applicationId(applicationId)
            .complianceOfficerId(complianceOfficer.getId())
            .complianceOfficerName(officerProfileService.getOfficerDisplayName(complianceOfficer))
            .decisionType(isApproved ? com.tss.loan.dto.request.ComplianceDecisionRequest.ComplianceDecisionType.CLEARED : 
                com.tss.loan.dto.request.ComplianceDecisionRequest.ComplianceDecisionType.REJECTED)
            .newStatus(ApplicationStatus.READY_FOR_DECISION)
            .decisionNotes(request.getNotesToLoanOfficer())
            .processedAt(LocalDateTime.now())
            .additionalNotes(request.getNotesToLoanOfficer())
            .previousStatus(oldStatus)
            .nextSteps("Loan officer will review compliance decision and make final approval/rejection")
            .investigationData(investigationData) // Include investigation data for loan officer
            .build();
    }
    
    /**
     * Helper method to check if there are pending compliance documents
     */
    private boolean hasPendingComplianceDocuments(UUID applicationId) {
        List<com.tss.loan.entity.loan.LoanDocument> allDocs = loanDocumentRepository.findByLoanApplicationId(applicationId);
        
        // Check if there are any compliance documents that are still pending
        return allDocs.stream()
            .anyMatch(doc -> {
                // Check if it's a compliance document
                boolean isComplianceDoc = doc.getVerificationNotes() != null && 
                    doc.getVerificationNotes().contains("[COMPLIANCE_ONLY]");
                
                // Check if it's pending
                boolean isPending = doc.getVerificationStatus() == null || 
                    doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.PENDING;
                
                return isComplianceDoc && isPending;
            });
    }
    
    @Override
    public List<LoanApplicationResponse> getCompletedApplications(User complianceOfficer) {
        log.info("Fetching completed applications for compliance officer: {}", complianceOfficer.getEmail());
        
        // Show applications that compliance has completed and sent to loan officer with a decision
        // These are applications in READY_FOR_DECISION (compliance marked APPROVE/REJECT when submitting decision)
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedComplianceOfficerOrderByCreatedAtDesc(complianceOfficer)
            .stream()
            .filter(app -> {
                ApplicationStatus status = app.getStatus();
                return status == ApplicationStatus.READY_FOR_DECISION;
            })
            .collect(Collectors.toList());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
}
