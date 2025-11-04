package com.tss.loan.service.impl;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.request.DocumentResubmissionRequest;
import com.tss.loan.dto.request.DocumentVerificationRequest;
import com.tss.loan.dto.response.AuditLogResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.DocumentResubmissionResponse;
import com.tss.loan.dto.response.ExternalVerificationResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.dto.response.OfficerDashboardResponse;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.Priority;
import com.tss.loan.entity.enums.NotificationType;
import com.tss.loan.entity.enums.RiskLevel;
import com.tss.loan.entity.external.CreditScoreHistory;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.loan.LoanDocument;
import com.tss.loan.entity.user.User;
import com.tss.loan.exception.LoanApiException;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.repository.ApplicantFinancialProfileRepository;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.LoanDocumentRepository;
import com.tss.loan.repository.external.CreditScoreHistoryRepository;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.AuditLogService;
import com.tss.loan.service.LoanOfficerService;
import com.tss.loan.service.NotificationService;
import com.tss.loan.service.OfficerProfileService;
import com.tss.loan.service.UserDisplayService;

import lombok.extern.slf4j.Slf4j;

@Service
@Transactional
@Slf4j
public class LoanOfficerServiceImpl implements LoanOfficerService {
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private LoanDocumentRepository loanDocumentRepository;
    
    @Autowired
    private ApplicantPersonalDetailsRepository personalDetailsRepository;
    
    @Autowired
    private ApplicantFinancialProfileRepository financialProfileRepository;
    
    @Autowired
    private LoanApplicationMapper loanApplicationMapper;
    
    @Autowired
    private CreditScoreHistoryRepository creditScoreHistoryRepository;
    
    @Autowired
    private UserDisplayService userDisplayService;
    
    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private com.tss.loan.repository.AuditLogRepository auditLogRepository;
    
    @Autowired
    private ApplicationWorkflowService applicationWorkflowService;
    
    @Autowired
    private OfficerProfileService officerProfileService;
    
    
    @Override
    public OfficerDashboardResponse getDashboard(User officer) {
        log.info("Building dashboard for officer: {}", officer.getEmail());
        
        // Get all applications assigned to this officer
        List<LoanApplication> assignedApplications = loanApplicationRepository
            .findByAssignedOfficerOrderByCreatedAtDesc(officer);
        
        // Calculate statistics
        int totalAssigned = assignedApplications.size();
        int pendingReview = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.UNDER_REVIEW)
            .count();
        int underDocumentVerification = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.DOCUMENT_VERIFICATION)
            .count();
        int pendingExternalVerification = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.PENDING_EXTERNAL_VERIFICATION)
            .count();
        int readyForDecision = (int) assignedApplications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.READY_FOR_DECISION)
            .count();
        
        // Today's statistics
        LocalDateTime startOfDay = LocalDateTime.now().truncatedTo(ChronoUnit.DAYS);
        int completedToday = (int) assignedApplications.stream()
            .filter(app -> (app.getStatus() == ApplicationStatus.APPROVED || 
                           app.getStatus() == ApplicationStatus.REJECTED) &&
                          app.getUpdatedAt().isAfter(startOfDay))
            .count();
        
        // Week statistics
        LocalDateTime startOfWeek = LocalDateTime.now().minusDays(7);
        int completedThisWeek = (int) assignedApplications.stream()
            .filter(app -> (app.getStatus() == ApplicationStatus.APPROVED || 
                           app.getStatus() == ApplicationStatus.REJECTED) &&
                          app.getUpdatedAt().isAfter(startOfWeek))
            .count();
        
        // Month statistics
        LocalDateTime startOfMonth = LocalDateTime.now().minusDays(30);
        int completedThisMonth = (int) assignedApplications.stream()
            .filter(app -> (app.getStatus() == ApplicationStatus.APPROVED || 
                           app.getStatus() == ApplicationStatus.REJECTED) &&
                          app.getUpdatedAt().isAfter(startOfMonth))
            .count();
        
        // Calculate average processing time
        double averageProcessingTimeHours = calculateAverageProcessingTime(assignedApplications);
        
        // Priority breakdown calculation
        int highPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == Priority.HIGH)
            .count();
        int mediumPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == Priority.MEDIUM)
            .count();
        int lowPriority = (int) assignedApplications.stream()
            .filter(app -> app.getPriority() == Priority.LOW || app.getPriority() == null)
            .count();
        
        OfficerDashboardResponse.PriorityBreakdown priorityBreakdown = 
            OfficerDashboardResponse.PriorityBreakdown.builder()
                .high(highPriority)
                .medium(mediumPriority)
                .low(lowPriority)
                .build();
        
        // High priority applications
        int urgentApplications = (int) assignedApplications.stream()
            .filter(app -> app.getRequestedAmount().doubleValue() > 1000000 && 
                          app.getStatus() == ApplicationStatus.UNDER_REVIEW)
            .count();
        
        int highValueApplications = (int) assignedApplications.stream()
            .filter(app -> app.getRequestedAmount().doubleValue() > 500000)
            .count();
        
        // Recent applications (last 5)
        List<OfficerDashboardResponse.LoanApplicationSummary> recentApplications = assignedApplications.stream()
            .limit(5)
            .map(app -> OfficerDashboardResponse.LoanApplicationSummary.builder()
                .id(app.getId().toString())
                .applicantName(userDisplayService.getDisplayName(app.getApplicant()))
                .applicantEmail(app.getApplicant().getEmail())
                .loanType(app.getLoanType() != null ? app.getLoanType().toString() : "PERSONAL")
                .requestedAmount(app.getRequestedAmount().doubleValue())
                .status(app.getStatus().toString())
                .priority(app.getPriority() != null ? app.getPriority().toString() : "LOW")
                .submittedAt(app.getCreatedAt())
                .build())
            .collect(Collectors.toList());
        
        // Recent activities (last 10 audit entries)
        List<OfficerDashboardResponse.RecentActivity> recentActivities = assignedApplications.stream()
            .limit(10)
            .map(app -> OfficerDashboardResponse.RecentActivity.builder()
                .id(java.util.UUID.randomUUID().toString())
                .action("Application " + app.getStatus().toString().replace("_", " ").toLowerCase())
                .applicationId(app.getId().toString())
                .applicantName(userDisplayService.getDisplayName(app.getApplicant()))
                .status(app.getStatus().toString())
                .timestamp(app.getUpdatedAt() != null ? app.getUpdatedAt() : app.getCreatedAt())
                .performedBy(officerProfileService.getOfficerDisplayName(officer))
                .build())
            .collect(Collectors.toList());
        
        // Build response
        return OfficerDashboardResponse.builder()
            .officerId(officer.getId())
            .officerName(officerProfileService.getOfficerDisplayName(officer))
            .officerEmail(officer.getEmail())
            .role(officer.getRole().toString())
            .totalAssigned(totalAssigned) // Fixed field name
            .pendingReview(pendingReview)
            .underVerification(underDocumentVerification) // Fixed field name
            .pendingExternalVerification(pendingExternalVerification)
            .readyForDecision(readyForDecision)
            .completedToday(completedToday)
            .completedThisWeek(completedThisWeek)
            .completedThisMonth(completedThisMonth)
            .avgProcessingTime(averageProcessingTimeHours) // Fixed field name
            .applicationsProcessedToday(completedToday)
            .applicationsProcessedThisWeek(completedThisWeek)
            .priorityBreakdown(priorityBreakdown) // NEW
            .recentApplications(recentApplications) // NEW
            .recentActivities(recentActivities) // NEW
            .lastLoginAt(officer.getLastLoginAt())
            .lastActivityAt(LocalDateTime.now())
            .hasCapacityForNewApplications(totalAssigned < 10)
            .maxWorkloadCapacity(10)
            .currentWorkload(totalAssigned)
            .urgentApplications(urgentApplications)
            .highValueApplications(highValueApplications)
            .flaggedApplications(0) // TODO: Implement flagged applications
            .build();
    }
    
    @Override
    public List<LoanApplicationResponse> getAssignedApplications(User officer) {
        log.info("Fetching assigned applications for officer: {}", officer.getEmail());
        
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedOfficerOrderByCreatedAtDesc(officer);
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public LoanApplicationResponse getApplicationForReview(UUID applicationId, User officer) {
        log.info("Officer {} requesting application {} for review", officer.getEmail(), applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Security check - ensure officer is assigned to this application
        if (!application.getAssignedOfficer().getId().equals(officer.getId())) {
            throw new LoanApiException("You are not authorized to review this application");
        }
        
        // Audit log
        auditLogService.logAction(officer, "APPLICATION_REVIEWED", "LoanApplication", 
            null, "Officer accessed application for review: " + applicationId);
        
        return loanApplicationMapper.toResponse(application);
    }
    
    @Override
    public CompleteApplicationDetailsResponse getCompleteApplicationDetails(UUID applicationId, User officer) {
        log.info("Officer {} requesting complete details for application: {}", officer.getEmail(), applicationId);
        
        LoanApplication application = getApplicationAndValidateOfficer(applicationId, officer);
        
        // Build complete application details response
        CompleteApplicationDetailsResponse response = buildCompleteApplicationDetails(application);
        
        // Audit log
        auditLogService.logAction(officer, "COMPLETE_APPLICATION_DETAILS_ACCESSED", "LoanApplication", 
            null, "Officer accessed complete application details for verification: " + applicationId);
        
        return response;
    }
    
    @Override
    public CompleteApplicationDetailsResponse getCompleteApplicationDetailsInternal(UUID applicationId) {
        log.info("Internal service requesting complete details for application: {}", applicationId);
        
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Build complete application details response without officer validation
        CompleteApplicationDetailsResponse response = buildCompleteApplicationDetails(application);
        
        return response;
    }
    
    @Override
    public void startDocumentVerification(UUID applicationId, User officer) {
        log.info("Starting document verification for application: {}", applicationId);
        
        LoanApplication application = getApplicationAndValidateOfficer(applicationId, officer);
        
        // Update status to document verification
        application.setStatus(ApplicationStatus.DOCUMENT_VERIFICATION);
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Create workflow entry
        applicationWorkflowService.createWorkflowEntry(
            applicationId,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.DOCUMENT_VERIFICATION,
            officer,
            "Document verification started by loan officer"
        );
        
        // Notify applicant
        notificationService.createNotification(
            application.getApplicant(),
            NotificationType.IN_APP,
            "Document Verification Started",
            "Your loan application documents are being verified by our loan officer."
        );
        
        // Audit log
        auditLogService.logAction(officer, "DOCUMENT_VERIFICATION_STARTED", "LoanApplication", 
            null, "Document verification process initiated: " + applicationId);
        
        log.info("Document verification started for application: {}", applicationId);
    }
    
    @Override
    @Transactional  // Method-level transaction for better control
    public void completeDocumentVerification(UUID applicationId, DocumentVerificationRequest request, User officer) {
        log.info("Completing document verification for application: {}", applicationId);
        
        LoanApplication application = getApplicationAndValidateOfficer(applicationId, officer);
        
        // ✅ PHASE 1: Update documents first (batch update for better performance)
        List<Long> documentIds = request.getDocumentVerifications().stream()
            .map(doc -> Long.parseLong(doc.getDocumentId()))
            .collect(Collectors.toList());
        
        List<LoanDocument> documents = loanDocumentRepository.findAllById(documentIds);
        LocalDateTime verifiedAt = LocalDateTime.now();
        
        for (DocumentVerificationRequest.DocumentVerificationItem docVerification : request.getDocumentVerifications()) {
            Long documentId = Long.parseLong(docVerification.getDocumentId());
            LoanDocument document = documents.stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new LoanApiException("Document not found: " + documentId));
            
            // Update document verification status
            if (docVerification.getVerified()) {
                document.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.VERIFIED);
                document.setVerificationNotes(docVerification.getVerificationNotes());
            } else {
                document.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.REJECTED);
                document.setVerificationNotes(docVerification.getRejectionReason());
            }
            document.setVerifiedAt(verifiedAt);
            document.setVerifiedBy(officer);
        }
        loanDocumentRepository.saveAll(documents);  // ✅ Batch save for performance
        loanDocumentRepository.flush();  // ✅ Force flush to release locks
        
        // ✅ PHASE 2: Update personal details (separate transaction boundary)
        if (application.getApplicant() != null) {
            com.tss.loan.entity.applicant.ApplicantPersonalDetails personalDetails = 
                personalDetailsRepository.findByUserId(application.getApplicant().getId()).orElse(null);
            if (personalDetails != null) {
                personalDetails.setIdentityVerified(request.getIdentityVerified());
                personalDetails.setIdentityVerificationNotes(request.getIdentityVerificationNotes());
                personalDetails.setAddressVerified(request.getAddressVerified());
                personalDetails.setIdentityVerifiedAt(verifiedAt);
                personalDetails.setAddressVerifiedAt(verifiedAt);
                personalDetailsRepository.saveAndFlush(personalDetails);  // ✅ Immediate flush
            }
        }
        
        // ✅ PHASE 3: Update financial profile (with retry logic for deadlock)
        try {
            com.tss.loan.entity.financial.ApplicantFinancialProfile financialProfile = 
                financialProfileRepository.findByLoanApplicationId(applicationId).orElse(null);
            if (financialProfile != null) {
                financialProfile.setEmploymentVerificationStatus(
                    request.getEmploymentVerified() ? com.tss.loan.entity.enums.VerificationStatus.VERIFIED : 
                    com.tss.loan.entity.enums.VerificationStatus.REJECTED);
                financialProfile.setIncomeVerificationStatus(
                    request.getIncomeVerified() ? com.tss.loan.entity.enums.VerificationStatus.VERIFIED : 
                    com.tss.loan.entity.enums.VerificationStatus.REJECTED);
                financialProfile.setBankVerificationStatus(
                    request.getBankAccountVerified() ? com.tss.loan.entity.enums.VerificationStatus.VERIFIED : 
                    com.tss.loan.entity.enums.VerificationStatus.REJECTED);
                financialProfile.setEmploymentVerifiedAt(verifiedAt);
                financialProfile.setIncomeVerifiedAt(verifiedAt);
                financialProfile.setBankVerifiedAt(verifiedAt);
                
                // Set specific verification notes
                String combinedNotes = buildVerificationNotes(request);
                financialProfile.setVerificationNotes(combinedNotes);
                financialProfileRepository.saveAndFlush(financialProfile);  // ✅ Immediate flush
            }
        } catch (Exception e) {
            log.error("Error updating financial profile for application: {}. Continuing with workflow.", applicationId, e);
            // ✅ Continue processing even if financial profile update fails
        }
        
        // ✅ PHASE 4: Update application status and create workflow (final phase)
        ApplicationStatus oldStatus = application.getStatus();
        ApplicationStatus newStatus;
        String workflowComment;
        String notificationTitle;
        String notificationMessage;
        
        if (request.getOverallVerificationPassed()) {
            newStatus = ApplicationStatus.PENDING_EXTERNAL_VERIFICATION;
            workflowComment = "Document verification completed successfully - ready for external verification";
            notificationTitle = "Documents Verified Successfully";
            notificationMessage = "Your documents have been verified successfully. Your application is now being processed for external verification.";
        } else {
            newStatus = ApplicationStatus.DOCUMENT_INCOMPLETE;
            workflowComment = "Document verification failed - resubmission required: " + request.getGeneralNotes();
            notificationTitle = "Document Resubmission Required";
            notificationMessage = "Some of your documents need to be resubmitted. Please check your application and upload the required documents.";
        }
        
        application.setStatus(newStatus);
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.saveAndFlush(application);  // ✅ Immediate flush
        
        // ✅ PHASE 5: Create workflow and notifications (async-safe operations)
        try {
            applicationWorkflowService.createWorkflowEntry(
                applicationId,
                oldStatus,
                newStatus,
                officer,
                workflowComment
            );
        } catch (Exception e) {
            log.error("Error creating workflow entry for application: {}", applicationId, e);
        }
        
        try {
            notificationService.createNotification(
                application.getApplicant(),
                NotificationType.EMAIL,
                notificationTitle,
                notificationMessage
            );
        } catch (Exception e) {
            log.error("Error creating notification for application: {}", applicationId, e);
        }
        
        // ✅ PHASE 6: Audit log (final operation)
        try {
            auditLogService.logAction(officer, "DOCUMENT_VERIFICATION_COMPLETED", "LoanApplication", 
                null, "Document verification completed with result: " + request.getOverallVerificationPassed() + " for application: " + applicationId);
        } catch (Exception e) {
            log.error("Error creating audit log for application: {}", applicationId, e);
        }
        
        log.info("Document verification completed for application: {} with result: {}", 
            applicationId, request.getOverallVerificationPassed());
    }
    
    @Override
    public void triggerExternalVerification(UUID applicationId, User officer) {
        log.info("Triggering external verification for application: {}", applicationId);
        
        LoanApplication application = getApplicationAndValidateOfficer(applicationId, officer);
        
        // Validate application is ready for external verification
        if (application.getStatus() != ApplicationStatus.PENDING_EXTERNAL_VERIFICATION) {
            throw new LoanApiException("Application is not ready for external verification. Current status: " + application.getStatus());
        }
        
        // Update status to indicate external verification is in progress
        application.setStatus(ApplicationStatus.FRAUD_CHECK);
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Create workflow entry
        applicationWorkflowService.createWorkflowEntry(
            applicationId,
            ApplicationStatus.PENDING_EXTERNAL_VERIFICATION,
            ApplicationStatus.FRAUD_CHECK,
            officer,
            "External verification (fraud detection) triggered by loan officer"
        );
        
        // TODO: Implement actual external API calls here
        // For now, we'll simulate the process
        
        // Notify applicant
        notificationService.createNotification(
            application.getApplicant(),
            NotificationType.IN_APP,
            "External Verification Started",
            "Your application is being verified through external agencies. This may take a few minutes."
        );
        
        // Audit log
        auditLogService.logAction(officer, "EXTERNAL_VERIFICATION_TRIGGERED", "LoanApplication", 
            null, "External verification process initiated: " + applicationId);
        
        log.info("External verification triggered for application: {}", applicationId);
    }
    
    @Override
    public ExternalVerificationResponse completeExternalVerification(UUID applicationId, User officer) {
        log.info("Completing external verification for application: {} by officer: {}", applicationId, officer.getEmail());
        
        // Get application
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found"));
        
        // Validate current status
        if (application.getStatus() != ApplicationStatus.FRAUD_CHECK) {
            throw new LoanApiException("Application is not in fraud check status. Current status: " + application.getStatus());
        }
        
        // Validate officer authority
        if (application.getAssignedOfficer() == null || !application.getAssignedOfficer().getId().equals(officer.getId())) {
            throw new LoanApiException("You are not authorized to complete verification for this application");
        }
        
        // ✅ DIRECT EXTERNAL CREDIT SCORING IMPLEMENTATION (MOVED FROM ExternalScoreService)
        log.info("Starting external credit score calculation for application: {}", applicationId);
        
        // Initialize ALL scoring variables (matching stored procedure outputs)
        Integer creditScore = null;
        String riskType = "UNKNOWN";
        Integer riskTypeNumeric = 0;
        Boolean redAlertFlag = false;
        BigDecimal totalOutstanding = BigDecimal.ZERO;
        Integer activeLoansCount = 0;
        Integer totalMissedPayments = 0;
        Boolean hasDefaults = false;
        Integer activeFraudCases = 0;
        String riskFactors = "No external data available for assessment";
        String creditScoreReason = "Unable to calculate";
        Boolean dataFound = false;
        
        try {
            // Get applicant personal details for Aadhaar and PAN
            ApplicantPersonalDetails personalDetails = personalDetailsRepository.findByUserId(application.getApplicant().getId())
                .orElseThrow(() -> new LoanApiException("Applicant personal details not found"));
            
            String aadhaar = personalDetails.getAadhaarNumber();
            String pan = personalDetails.getPanNumber();
            LocalDateTime calculatedAt = LocalDateTime.now();
            
            log.info("Found personal details for user: {}, Aadhaar: {}, PAN: {}", 
                application.getApplicant().getId(), aadhaar, pan);
            
            // Validate Aadhaar and PAN are present
            if (aadhaar == null || pan == null) {
                throw new LoanApiException("Aadhaar or PAN number is missing in personal details");
            }
            
            // ✅ DIRECT STORED PROCEDURE EXECUTION (FROM ExternalScoreServiceImpl)
            log.info("Executing stored procedure for Aadhaar: {} and PAN: {}", aadhaar, pan);
            
            Object[] result = creditScoreHistoryRepository.executeCalculateExternalScores(aadhaar, pan);
            
            if (result != null && result.length > 0) {
                log.info("Stored procedure executed successfully. Result array length: {}", result.length);
                
                // Parse ALL stored procedure results (12 output parameters)
                creditScore = result[0] != null ? ((Number) result[0]).intValue() : null;
                riskType = result[1] != null ? result[1].toString() : "UNKNOWN";
                riskTypeNumeric = result[2] != null ? ((Number) result[2]).intValue() : 0;
                redAlertFlag = result[3] != null ? ((Number) result[3]).intValue() == 1 : false;
                totalOutstanding = result[4] != null ? new BigDecimal(result[4].toString()) : BigDecimal.ZERO;
                activeLoansCount = result[5] != null ? ((Number) result[5]).intValue() : 0;
                totalMissedPayments = result[6] != null ? ((Number) result[6]).intValue() : 0;
                hasDefaults = result[7] != null ? ((Number) result[7]).intValue() == 1 : false;
                activeFraudCases = result[8] != null ? ((Number) result[8]).intValue() : 0;
                riskFactors = result[9] != null ? result[9].toString() : "No risk factors identified";
                creditScoreReason = result[10] != null ? result[10].toString() : "Based on available data";
                dataFound = result[11] != null ? ((Number) result[11]).intValue() == 1 : false;
                
                // Handle different response scenarios
                if ("INVALID".equals(riskType)) {
                    log.error("Identity mismatch detected for Aadhaar: {} and PAN: {}. Risk Score: INVALID", aadhaar, pan);
                } else if (dataFound && creditScore != null) {
                    // Valid data found - save to history
                    saveCreditScoreHistory(aadhaar, pan, creditScore, riskType, hasDefaults, 
                                         activeFraudCases.longValue(), calculatedAt);
                    
                    log.info("Score calculation completed. Credit Score: {}, Risk Score: {}, Numeric Risk: {}, Red Alert: {}", 
                             creditScore, riskType, riskTypeNumeric, redAlertFlag);
                } else {
                    log.warn("No external data found for Aadhaar: {} and PAN: {}", aadhaar, pan);
                    
                    // 🔴 REAL-WORLD BANKING SCENARIO: NO CREDIT HISTORY = HIGH RISK
                    // Use credit score from stored procedure if calculated (should be 350 for no data)
                    // Only override if stored procedure didn't set it
                    if (creditScore == null) {
                        creditScore = 350; // Low credit score for first-time borrower
                    }
                    
                    // Use values from stored procedure if set, otherwise use defaults
                    if ("UNKNOWN".equals(riskType)) {
                        riskType = "HIGH";
                    }
                    if (riskTypeNumeric == 0) {
                        riskTypeNumeric = 75;
                    }
                    if (riskFactors == null || riskFactors.isEmpty() || riskFactors.equals("No risk factors identified")) {
                        riskFactors = "No credit history found. First-time borrower with unverified creditworthiness.";
                    }
                    if (creditScoreReason == null || creditScoreReason.isEmpty() || creditScoreReason.equals("Based on available data")) {
                        creditScoreReason = "Insufficient external data for credit assessment. Low score assigned due to lack of credit history.";
                    }
                    
                    log.warn("HIGH RISK assigned - clean record but no credit history for Aadhaar: {} and PAN: {}. Credit Score: {}", 
                            aadhaar, pan, creditScore);
                }
            } else {
                log.warn("Stored procedure returned no results for Aadhaar: {} and PAN: {}", aadhaar, pan);
                
                // 🔴 REAL-WORLD BANKING SCENARIO: NO DATA = HIGH RISK
                // Assign low credit score for first-time borrower when stored procedure returns no results
                creditScore = 350; // Low credit score for first-time borrower
                riskType = "HIGH";
                riskTypeNumeric = 75;
                redAlertFlag = false; // Not fraud, just high risk due to no history
                riskFactors = "No credit history found. First-time borrower with unverified creditworthiness.";
                creditScoreReason = "Insufficient external data for credit assessment. Low score assigned due to lack of credit history.";
                
                log.warn("HIGH RISK assigned due to no external credit history for Aadhaar: {} and PAN: {}. Credit Score: {}", 
                        aadhaar, pan, creditScore);
            }
            
            // ✅ Store ALL external verification results in LoanApplication entity
            application.setCreditScore(creditScore);
            application.setRiskLevel(convertToRiskLevelEnum(riskType));  // Convert String to Enum
            application.setFraudScore(riskTypeNumeric);
            application.setFraudReasons(riskFactors);
            application.setRedAlertFlag(redAlertFlag);
            
            // Store financial metrics
            application.setTotalOutstanding(totalOutstanding);
            application.setActiveLoansCount(activeLoansCount);
            application.setTotalMissedPayments(totalMissedPayments);
            application.setHasDefaults(hasDefaults);
            application.setActiveFraudCases(activeFraudCases);
            application.setExternalVerificationAt(LocalDateTime.now());
            
            log.info("Stored complete external verification results - Credit Score: {}, Risk Level: {}, " +
                    "Outstanding: {}, Active Loans: {}, Missed Payments: {}, Defaults: {}, Fraud Cases: {}", 
                    creditScore, riskType, totalOutstanding, activeLoansCount, 
                    totalMissedPayments, hasDefaults, activeFraudCases);
                
        } catch (Exception e) {
            log.error("Failed to calculate external credit score for application: {}", applicationId, e);
            // Set error values
            creditScore = null;
            riskType = "ERROR";
            riskTypeNumeric = 100;
            redAlertFlag = true;
            riskFactors = "System error occurred during score calculation: " + e.getMessage();
            creditScoreReason = "Unable to calculate due to system error";
            
            // Store error in application
            application.setCreditScore(creditScore);
            application.setRiskLevel(RiskLevel.CRITICAL);  // ERROR -> CRITICAL
            application.setFraudScore(riskTypeNumeric);
            application.setFraudReasons(riskFactors);
            application.setRedAlertFlag(redAlertFlag);
            application.setExternalVerificationAt(LocalDateTime.now());
        }
        
        // Update status directly to READY_FOR_DECISION (skip PENDING_EXTERNAL_VERIFICATION)
        ApplicationStatus previousStatus = application.getStatus();
        ApplicationStatus newStatus = ApplicationStatus.READY_FOR_DECISION;
        application.setStatus(newStatus);
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Log workflow transition
        applicationWorkflowService.createWorkflowEntry(
            applicationId,
            previousStatus,
            newStatus,
            officer,
            "External verification and credit scoring completed - Application ready for decision"
        );
        
        // TODO: Process actual fraud check results here
        // For now, we'll simulate successful completion
        
        // Notify applicant
        notificationService.createNotification(
            application.getApplicant(),
            NotificationType.IN_APP,
            "External Verification Completed",
            "Your application has been successfully verified through external agencies. Processing continues."
        );
        
        // Audit log
        auditLogService.logAction(officer, "EXTERNAL_VERIFICATION_COMPLETED", "LoanApplication", 
            null, "External verification process completed successfully: " + applicationId);
        
        log.info("External verification completed for application: {}", applicationId);
        
        // Build enhanced response with ALL credit scoring details
        ExternalVerificationResponse.ExternalVerificationResponseBuilder responseBuilder = ExternalVerificationResponse.builder()
            .message("External verification and credit scoring completed successfully")
            .applicationId(applicationId)
            .previousStatus("FRAUD_CHECK")
            .newStatus("READY_FOR_DECISION")
            .completedAt(LocalDateTime.now())
            // Credit Scoring Results
            .creditScore(creditScore)
            .riskType(riskType)
            .riskScoreNumeric(riskTypeNumeric)
            .riskFactors(riskFactors)
            .creditScoreReason(creditScoreReason)
            .redAlertFlag(redAlertFlag)
            // Financial Metrics
            .totalOutstanding(totalOutstanding)
            .activeLoansCount(activeLoansCount)
            .totalMissedPayments(totalMissedPayments)
            .hasDefaults(hasDefaults)
            .activeFraudCases(activeFraudCases)
            // Data Availability
            .dataFound(dataFound)
            // Next Steps
            .nextSteps("Application is ready for final decision - approve, reject, or flag for compliance")
            .readyForDecision(true);
            
        // 🏦 REAL-WORLD BANKING RECOMMENDATION LOGIC
        String recommendedAction = determineRecommendedAction(creditScore, riskType, riskTypeNumeric, redAlertFlag);
        responseBuilder.recommendedAction(recommendedAction);
        
        ExternalVerificationResponse response = responseBuilder.build();
        
        log.info("Complete external verification response prepared with all metrics - Credit Score: {}, Risk: {}, Outstanding: {}, Active Loans: {}", 
            creditScore, riskType, totalOutstanding, activeLoansCount);
            
        return response;
    }
    
    @Override
    public List<LoanApplicationResponse> getApplicationsReadyForDecision(User officer) {
        log.info("Fetching applications ready for decision for officer: {}", officer.getEmail());
        
        List<LoanApplication> applications = loanApplicationRepository
            .findByAssignedOfficerOrderByCreatedAtDesc(officer)
            .stream()
            .filter(app -> app.getStatus() == ApplicationStatus.READY_FOR_DECISION)
            .collect(Collectors.toList());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    public DocumentResubmissionResponse requestDocumentResubmission(UUID applicationId, DocumentResubmissionRequest request, User officer) {
        log.info("Officer {} requesting document resubmission for application: {}", officer.getEmail(), applicationId);
        
        LoanApplication application = getApplicationAndValidateOfficer(applicationId, officer);
        
        // Update application status to DOCUMENT_INCOMPLETE
        application.setStatus(ApplicationStatus.DOCUMENT_INCOMPLETE);
        application.setUpdatedAt(LocalDateTime.now());
        loanApplicationRepository.save(application);
        
        // Create workflow entry
        applicationWorkflowService.createWorkflowEntry(
            applicationId,
            ApplicationStatus.DOCUMENT_VERIFICATION,
            ApplicationStatus.DOCUMENT_INCOMPLETE,
            officer,
            "Document resubmission requested: " + request.getRejectedDocuments().size() + " documents need resubmission"
        );
        
        // Mark rejected documents in database
        for (DocumentResubmissionRequest.RejectedDocumentItem rejectedDoc : request.getRejectedDocuments()) {
            List<LoanDocument> documents = loanDocumentRepository.findByLoanApplicationId(applicationId);
            documents.stream()
                .filter(doc -> doc.getDocumentType().toString().equals(rejectedDoc.getDocumentType()))
                .forEach(doc -> {
                    doc.setVerificationStatus(com.tss.loan.entity.enums.VerificationStatus.REJECTED);
                    doc.setVerificationNotes(rejectedDoc.getRejectionReason());
                    doc.setVerifiedAt(LocalDateTime.now());
                    doc.setVerifiedBy(officer);
                    loanDocumentRepository.save(doc);
                });
        }
        
        // AUTOMATIC SAME-OFFICER REASSIGNMENT: Keep the same officer assigned
        // No need to change assignedOfficer - it remains the same for continuity
        log.info("Application {} will remain assigned to same officer {} after resubmission", applicationId, officer.getEmail());
        
        // Notify applicant about document resubmission requirement
        notificationService.createNotification(
            application.getApplicant(),
            NotificationType.EMAIL,
            "Document Resubmission Required",
            String.format("Your loan application requires document resubmission. Please resubmit %d documents by %s. Additional instructions: %s", 
                request.getRejectedDocuments().size(),
                request.getResubmissionDeadline().toString(),
                request.getAdditionalInstructions() != null ? request.getAdditionalInstructions() : "Please check the application for details.")
        );
        
        // Audit log
        auditLogService.logAction(officer, "DOCUMENT_RESUBMISSION_REQUESTED", "LoanApplication", 
            null, 
            String.format("Requested resubmission of %d documents for application %s. Same officer reassignment maintained.", request.getRejectedDocuments().size(), applicationId));
        
        // Build response
        List<DocumentResubmissionResponse.RejectedDocumentInfo> rejectedDocuments = request.getRejectedDocuments().stream()
            .map(item -> DocumentResubmissionResponse.RejectedDocumentInfo.builder()
                .documentType(item.getDocumentType())
                .rejectionReason(item.getRejectionReason())
                .requiredAction(item.getRequiredAction())
                .specificInstructions(item.getSpecificInstructions())
                .isRequired(item.getIsRequired())
                .build())
            .collect(Collectors.toList());
        
        DocumentResubmissionResponse response = DocumentResubmissionResponse.builder()
            .applicationId(applicationId)
            .applicationStatus(ApplicationStatus.DOCUMENT_INCOMPLETE.toString())
            .rejectedDocuments(rejectedDocuments)
            .resubmissionDeadline(request.getResubmissionDeadline())
            .additionalInstructions(request.getAdditionalInstructions())
            .notificationSent(true)
            .message("Document resubmission requested successfully. Application remains assigned to same officer for continuity.")
            .requestedAt(LocalDateTime.now())
            .requestedByOfficer(officer.getEmail())
            .build();
        
        log.info("Document resubmission requested successfully for application: {} with same-officer reassignment", applicationId);
        return response;
    }
    
    private LoanApplication getApplicationAndValidateOfficer(UUID applicationId, User officer) {
        LoanApplication application = loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new LoanApiException("Application not found: " + applicationId));
        
        // Security check
        if (!application.getAssignedOfficer().getId().equals(officer.getId())) {
            throw new LoanApiException("You are not authorized to perform this action on this application");
        }
        
        return application;
    }
    
    private double calculateAverageProcessingTime(List<LoanApplication> applications) {
        List<LoanApplication> completedApps = applications.stream()
            .filter(app -> app.getStatus() == ApplicationStatus.APPROVED || 
                          app.getStatus() == ApplicationStatus.REJECTED)
            .filter(app -> app.getSubmittedAt() != null && app.getFinalDecisionAt() != null)
            .collect(Collectors.toList());
        
        if (completedApps.isEmpty()) {
            return 0.0;
        }
        
        double totalHours = completedApps.stream()
            .mapToDouble(app -> ChronoUnit.HOURS.between(app.getSubmittedAt(), app.getFinalDecisionAt()))
            .sum();
        
        return totalHours / completedApps.size();
    }
    
    private CompleteApplicationDetailsResponse buildCompleteApplicationDetails(LoanApplication application) {
        // Get related entities
        com.tss.loan.entity.applicant.ApplicantPersonalDetails personalDetails = 
            personalDetailsRepository.findByUserId(application.getApplicant().getId()).orElse(null);
        
        com.tss.loan.entity.financial.ApplicantFinancialProfile financialProfile = 
            financialProfileRepository.findByLoanApplicationId(application.getId()).orElse(null);
        
        List<LoanDocument> documents = loanDocumentRepository.findByLoanApplicationId(application.getId());
        
        // Build application info
        CompleteApplicationDetailsResponse.ApplicationInfo applicationInfo = 
            CompleteApplicationDetailsResponse.ApplicationInfo.builder()
                .id(application.getId())
                .status(application.getStatus().toString())
                .loanAmount(application.getRequestedAmount())
                .tenureMonths(application.getTenureMonths())
                .purpose(application.getPurpose())
                .loanType(application.getLoanType().toString())
                .submittedAt(application.getSubmittedAt())
                .assignedAt(application.getCreatedAt()) // TODO: Add actual assignment timestamp
                .assignedOfficerName(application.getAssignedOfficer() != null ? 
                    officerProfileService.getOfficerDisplayName(application.getAssignedOfficer()) : null)
                .priority(application.getRequestedAmount().doubleValue() > 1000000 ? "HIGH" : "MEDIUM")
                .daysInReview((int) ChronoUnit.DAYS.between(application.getSubmittedAt(), LocalDateTime.now()))
                .build();
        
        // Build applicant identity
        CompleteApplicationDetailsResponse.ApplicantIdentity applicantIdentity = buildApplicantIdentity(application, personalDetails);
        
        // Build employment details
        CompleteApplicationDetailsResponse.EmploymentDetails employmentDetails = buildEmploymentDetails(financialProfile);
        
        // Build document information
        List<CompleteApplicationDetailsResponse.DocumentInfo> documentInfos = buildDocumentInfos(documents);
        
        // Build financial assessment
        CompleteApplicationDetailsResponse.FinancialAssessment financialAssessment = buildFinancialAssessment(application, financialProfile);
        
        // Build verification summary
        CompleteApplicationDetailsResponse.VerificationSummary verificationSummary = buildVerificationSummary(application, documents, personalDetails, financialProfile);
        
        // Build external verification
        CompleteApplicationDetailsResponse.ExternalVerification externalVerification = buildExternalVerification(application);
        
        return CompleteApplicationDetailsResponse.builder()
            .applicationInfo(applicationInfo)
            .applicantIdentity(applicantIdentity)
            .employmentDetails(employmentDetails)
            .documents(documentInfos)
            .financialAssessment(financialAssessment)
            .verificationSummary(verificationSummary)
            .externalVerification(externalVerification)
            .build();
    }
    
    private CompleteApplicationDetailsResponse.ApplicantIdentity buildApplicantIdentity(
            LoanApplication application, com.tss.loan.entity.applicant.ApplicantPersonalDetails personalDetails) {
        
        User applicant = application.getApplicant();
        
        // Personal details
        CompleteApplicationDetailsResponse.ApplicantIdentity.PersonalDetails personalDetailsDto = 
            CompleteApplicationDetailsResponse.ApplicantIdentity.PersonalDetails.builder()
                .firstName(personalDetails != null ? personalDetails.getFirstName() : null)
                .lastName(personalDetails != null ? personalDetails.getLastName() : null)
                .middleName(personalDetails != null ? personalDetails.getMiddleName() : null)
                .fullName(personalDetails != null ? personalDetails.getFullName() : applicant.getEmail())
                .panNumber(personalDetails != null ? personalDetails.getPanNumber() : null)
                .aadhaarNumber(personalDetails != null ? personalDetails.getAadhaarNumber() : null)
                .dateOfBirth(personalDetails != null ? personalDetails.getDateOfBirth().toString() : null)
                .gender(personalDetails != null && personalDetails.getGender() != null ? personalDetails.getGender().toString() : null)
                .maritalStatus(personalDetails != null && personalDetails.getMaritalStatus() != null ? personalDetails.getMaritalStatus().toString() : null)
                .addresses(personalDetails != null ? 
                    CompleteApplicationDetailsResponse.ApplicantIdentity.AddressInfo.builder()
                        .permanentAddress(personalDetails.getPermanentAddress())
                        .currentAddress(personalDetails.getCurrentAddress())
                        .city(personalDetails.getCurrentCity())
                        .state(personalDetails.getCurrentState())
                        .pincode(personalDetails.getCurrentPincode())
                        .build() : null)
                .build();
        
        // Contact info
        CompleteApplicationDetailsResponse.ApplicantIdentity.ContactInfo contactInfo = 
            CompleteApplicationDetailsResponse.ApplicantIdentity.ContactInfo.builder()
                .phone(applicant.getPhone())
                .email(applicant.getEmail())
                .alternatePhone(personalDetails != null ? personalDetails.getAlternatePhoneNumber() : null)
                .build();
        
        // Verification status
        CompleteApplicationDetailsResponse.ApplicantIdentity.VerificationStatus verificationStatus = 
            CompleteApplicationDetailsResponse.ApplicantIdentity.VerificationStatus.builder()
                .identityVerified(personalDetails != null ? personalDetails.getIdentityVerified() : false)
                .addressVerified(personalDetails != null ? personalDetails.getAddressVerified() : false)
                .phoneVerified(applicant.getIsPhoneVerified())
                .emailVerified(applicant.getIsEmailVerified())
                .identityVerificationNotes(personalDetails != null ? personalDetails.getIdentityVerificationNotes() : null)
                .build();
        
        return CompleteApplicationDetailsResponse.ApplicantIdentity.builder()
            .personalDetails(personalDetailsDto)
            .contactInfo(contactInfo)
            .verificationStatus(verificationStatus)
            .build();
    }
    
    private CompleteApplicationDetailsResponse.EmploymentDetails buildEmploymentDetails(
            com.tss.loan.entity.financial.ApplicantFinancialProfile financialProfile) {
        
        if (financialProfile == null) {
            return CompleteApplicationDetailsResponse.EmploymentDetails.builder().build();
        }
        
        // Company contact info
        CompleteApplicationDetailsResponse.EmploymentDetails.CompanyContact companyContact = 
            CompleteApplicationDetailsResponse.EmploymentDetails.CompanyContact.builder()
                .companyPhone(financialProfile.getWorkPhone())
                .companyEmail(financialProfile.getWorkEmail())
                .hrPhone(financialProfile.getHrPhone())
                .hrEmail(financialProfile.getHrEmail())
                .managerName(financialProfile.getManagerName())
                .managerPhone(financialProfile.getManagerPhone())
                .companyAddress(financialProfile.getCompanyAddress())
                .build();
        
        // Bank details
        CompleteApplicationDetailsResponse.EmploymentDetails.BankDetails bankDetails = 
            CompleteApplicationDetailsResponse.EmploymentDetails.BankDetails.builder()
                .bankName(financialProfile.getPrimaryBankName())
                .accountNumber(financialProfile.getPrimaryAccountNumber())
                .ifscCode(financialProfile.getIfscCode())
                .accountType(financialProfile.getAccountType())
                .branchName(financialProfile.getBranchName())
                .build();
        
        // Verification status
        CompleteApplicationDetailsResponse.EmploymentDetails.EmploymentVerificationStatus verificationStatus = 
            CompleteApplicationDetailsResponse.EmploymentDetails.EmploymentVerificationStatus.builder()
                .employmentVerified(financialProfile.getEmploymentVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED)
                .incomeVerified(financialProfile.getIncomeVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED)
                .bankAccountVerified(financialProfile.getBankVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED)
                .employmentVerificationNotes(financialProfile.getVerificationNotes())
                .incomeVerificationNotes(financialProfile.getVerificationNotes())
                .lastVerificationDate(financialProfile.getEmploymentVerifiedAt())
                .build();
        
        return CompleteApplicationDetailsResponse.EmploymentDetails.builder()
            .companyName(financialProfile.getEmployerName())
            .designation(financialProfile.getDesignation())
            .workExperience(financialProfile.getExperienceInYears() + " years")
            .employmentType(financialProfile.getEmploymentType().toString())
            .monthlyIncome(financialProfile.getTotalMonthlyIncome()) // Using business logic method
            .annualIncome(financialProfile.getAnnualIncome())
            .companyContact(companyContact)
            .bankDetails(bankDetails)
            .verificationStatus(verificationStatus)
            // Financial Obligations
            .existingLoanEmi(financialProfile.getExistingEmiAmount() != null ? financialProfile.getExistingEmiAmount() : java.math.BigDecimal.ZERO)
            .creditCardOutstanding(financialProfile.getCreditCardOutstanding() != null ? financialProfile.getCreditCardOutstanding() : java.math.BigDecimal.ZERO)
            .monthlyExpenses(financialProfile.getMonthlyExpenses() != null ? financialProfile.getMonthlyExpenses() : java.math.BigDecimal.ZERO)
            .build();
    }
    
    private List<CompleteApplicationDetailsResponse.DocumentInfo> buildDocumentInfos(List<LoanDocument> documents) {
        return documents.stream()
            .map(doc -> {
                return CompleteApplicationDetailsResponse.DocumentInfo.builder()
                    .documentId(doc.getId())
                    .documentType(doc.getDocumentType().toString())
                    .fileName(doc.getFileName())
                    .fileUrl(doc.getFilePath())
                    .uploadDate(doc.getUploadedAt())
                    .verificationStatus(doc.getVerificationStatus().toString())
                    .verificationNotes(doc.getVerificationNotes())
                    .rejectionReason(doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.REJECTED ? 
                        doc.getVerificationNotes() : null)
                    .isRequired(true) // TODO: Implement required document logic
                    .isResubmitted(false) // TODO: Implement resubmission tracking
                    .verifiedAt(doc.getVerifiedAt())
                    .viewedByComplianceAt(doc.getViewedByComplianceAt())
                    .verifiedByName(doc.getVerifiedBy() != null ? 
                        userDisplayService.getDisplayName(doc.getVerifiedBy()) : null)
                    .fileSizeBytes(doc.getFileSize())
                    .fileType(doc.getFileType())
                    .build();
            })
            .collect(Collectors.toList());
    }
    
    private CompleteApplicationDetailsResponse.FinancialAssessment buildFinancialAssessment(
            LoanApplication application, com.tss.loan.entity.financial.ApplicantFinancialProfile financialProfile) {
        
        // Loan details
        CompleteApplicationDetailsResponse.FinancialAssessment.LoanDetails loanDetails = 
            CompleteApplicationDetailsResponse.FinancialAssessment.LoanDetails.builder()
                .requestedAmount(application.getRequestedAmount())
                .tenureMonths(application.getTenureMonths())
                .purpose(application.getPurpose())
                .estimatedEmi(calculateEMI(application.getRequestedAmount(), application.getTenureMonths()))
                .estimatedInterestRate(java.math.BigDecimal.valueOf(12.0)) // TODO: Implement dynamic interest rate
                .build();
        
        // Existing loans (TODO: Implement existing loans tracking)
        List<CompleteApplicationDetailsResponse.FinancialAssessment.ExistingLoan> existingLoans = 
            java.util.Collections.emptyList();
        
        // Calculated ratios
        CompleteApplicationDetailsResponse.FinancialAssessment.CalculatedRatios calculatedRatios = null;
        if (financialProfile != null) {
            java.math.BigDecimal emi = calculateEMI(application.getRequestedAmount(), application.getTenureMonths());
            double emiRatio = emi.doubleValue() / financialProfile.getTotalMonthlyIncome().doubleValue() * 100;
            
            calculatedRatios = CompleteApplicationDetailsResponse.FinancialAssessment.CalculatedRatios.builder()
                .emiToIncomeRatio(emiRatio)
                .debtToIncomeRatio(0.0) // TODO: Calculate based on existing loans
                .loanToIncomeRatio(application.getRequestedAmount().doubleValue() / financialProfile.getAnnualIncome().doubleValue() * 100)
                .affordabilityStatus(emiRatio <= 40 ? "AFFORDABLE" : "HIGH_RISK")
                .recommendation(emiRatio <= 40 ? "APPROVE" : "REVIEW_REQUIRED")
                .build();
        }
        
        // Risk assessment
        CompleteApplicationDetailsResponse.FinancialAssessment.RiskAssessment riskAssessment = 
            CompleteApplicationDetailsResponse.FinancialAssessment.RiskAssessment.builder()
                .riskLevel(application.getRiskLevel() != null ? application.getRiskLevel().toString() : "LOW")
                .riskScore(application.getRiskScore() != null ? application.getRiskScore() : 0)
                .fraudScore(application.getFraudScore() != null ? application.getFraudScore() : 0)
                .riskFactors(java.util.Collections.emptyList()) // TODO: Implement risk factors
                .overallAssessment("PENDING_EXTERNAL_VERIFICATION")
                .build();
        
        return CompleteApplicationDetailsResponse.FinancialAssessment.builder()
            .loanDetails(loanDetails)
            .existingLoans(existingLoans)
            .calculatedRatios(calculatedRatios)
            .riskAssessment(riskAssessment)
            .build();
    }
    
    private CompleteApplicationDetailsResponse.ExternalVerification buildExternalVerification(LoanApplication application) {
        // Check if external verification has been completed
        if (application.getCreditScore() == null && application.getFraudScore() == null) {
            return null; // No external verification data available
        }
        
        // ✅ Read ALL data directly from LoanApplication entity (stored during external verification)
        String riskLevelStr = application.getRiskLevel() != null ? application.getRiskLevel().toString() : "UNKNOWN";
        BigDecimal totalOutstanding = application.getTotalOutstanding() != null ? application.getTotalOutstanding() : BigDecimal.ZERO;
        Integer activeLoansCount = application.getActiveLoansCount() != null ? application.getActiveLoansCount() : 0;
        Integer totalMissedPayments = application.getTotalMissedPayments() != null ? application.getTotalMissedPayments() : 0;
        Boolean hasDefaults = application.getHasDefaults() != null ? application.getHasDefaults() : false;
        Integer activeFraudCases = application.getActiveFraudCases() != null ? application.getActiveFraudCases() : 0;
        Boolean redAlertFlag = application.getRedAlertFlag() != null ? application.getRedAlertFlag() : false;
        
        // Determine recommended action based on scores
        String recommendedAction = determineRecommendedAction(
            application.getCreditScore(), 
            riskLevelStr, 
            hasDefaults, 
            activeFraudCases
        );
        
        // Check if data was found
        Boolean dataFound = (application.getCreditScore() != null && application.getCreditScore() > 0) ||
                           (application.getFraudScore() != null && application.getFraudScore() > 0);
        
        return CompleteApplicationDetailsResponse.ExternalVerification.builder()
            .creditScore(application.getCreditScore())
            .creditScoreReason(application.getCreditScore() != null && application.getCreditScore() > 0 ? 
                "Based on external credit history" : "Insufficient data for credit score calculation")
            .riskLevel(riskLevelStr)
            .riskScoreNumeric(application.getFraudScore())
            .redAlertFlag(redAlertFlag)
            .riskFactors(application.getFraudReasons() != null ? application.getFraudReasons() : "No risk factors identified")
            // Financial Metrics
            .totalOutstanding(totalOutstanding)
            .activeLoansCount(activeLoansCount)
            .totalMissedPayments(totalMissedPayments)
            .hasDefaults(hasDefaults)
            .activeFraudCases(activeFraudCases)
            // Data Availability
            .dataFound(dataFound)
            // Metadata
            .recommendedAction(recommendedAction)
            .verifiedAt(application.getExternalVerificationAt() != null ? application.getExternalVerificationAt() : application.getUpdatedAt())
            .build();
    }
    
    /**
     * Convert String risk type from stored procedure to RiskLevel enum
     */
    private RiskLevel convertToRiskLevelEnum(String riskTypeString) {
        if (riskTypeString == null) {
            return RiskLevel.UNKNOWN;
        }
        
        try {
            // Handle special cases
            if ("VERY_LOW".equals(riskTypeString)) return RiskLevel.VERY_LOW;
            if ("VERY_HIGH".equals(riskTypeString)) return RiskLevel.VERY_HIGH;
            
            return RiskLevel.valueOf(riskTypeString.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown risk type: {}, defaulting to UNKNOWN", riskTypeString);
            return RiskLevel.UNKNOWN;
        }
    }
    
    /**
     * Determine recommended action based on credit score and risk factors
     */
    private String determineRecommendedAction(Integer creditScore, String riskType, 
                                             Boolean hasDefaults, Integer activeFraudCases) {
        // High risk scenarios - immediate rejection
        if (activeFraudCases > 0) {
            return "IMMEDIATE_REJECTION_RECOMMENDED - Active fraud cases detected";
        }
        
        if (hasDefaults) {
            return "FLAG_FOR_COMPLIANCE_REVIEW - Loan default history found";
        }
        
        if ("HIGH".equals(riskType)) {
            return "IMMEDIATE_REJECTION_RECOMMENDED - High risk profile";
        }
        
        // Credit score based recommendations
        if (creditScore != null) {
            if (creditScore < 400) {
                return "IMMEDIATE_REJECTION_RECOMMENDED - Credit score too low";
            } else if (creditScore < 550) {
                return "FLAG_FOR_COMPLIANCE_REVIEW - Below minimum credit threshold";
            } else if (creditScore >= 750 && "LOW".equals(riskType)) {
                return "APPROVAL_RECOMMENDED - Excellent credit profile";
            } else if (creditScore >= 650) {
                return "MANUAL_REVIEW_REQUIRED - Good credit, verify other factors";
            } else {
                return "MANUAL_REVIEW_REQUIRED - Fair credit score";
            }
        }
        
        // Medium risk
        if ("MEDIUM".equals(riskType)) {
            return "MANUAL_REVIEW_REQUIRED - Medium risk profile";
        }
        
        // Low risk or unknown
        if ("LOW".equals(riskType) || "VERY_LOW".equals(riskType)) {
            return "APPROVAL_RECOMMENDED - Low risk profile";
        }
        
        return "MANUAL_REVIEW_REQUIRED - Insufficient data for automated decision";
    }
    
    private CompleteApplicationDetailsResponse.VerificationSummary buildVerificationSummary(
            LoanApplication application, List<LoanDocument> documents, 
            com.tss.loan.entity.applicant.ApplicantPersonalDetails personalDetails,
            com.tss.loan.entity.financial.ApplicantFinancialProfile financialProfile) {
        
        // Calculate completion percentages
        boolean identityComplete = personalDetails != null && personalDetails.getPanNumber() != null && personalDetails.getAadhaarNumber() != null;
        
        // Documents complete: at least one document exists AND all are verified (none pending/rejected)
        boolean documentsComplete = !documents.isEmpty() && 
            documents.stream().allMatch(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.VERIFIED);
        
        // Employment complete: check based on employment type
        boolean employmentComplete = false;
        if (financialProfile != null && financialProfile.getEmploymentType() != null) {
            String empType = financialProfile.getEmploymentType().toString();
            // For types without employer: RETIRED, STUDENT, UNEMPLOYED, FREELANCER
            if (empType.equals("RETIRED") || empType.equals("STUDENT") || 
                empType.equals("UNEMPLOYED") || empType.equals("FREELANCER")) {
                employmentComplete = true; // No employer needed
            } else {
                // For SALARIED, SELF_EMPLOYED, BUSINESS_OWNER, PROFESSIONAL
                employmentComplete = financialProfile.getEmployerName() != null && 
                                   !financialProfile.getEmployerName().trim().isEmpty();
            }
        }
        
        // Financial complete: check all required financial fields
        boolean financialComplete = financialProfile != null && 
            financialProfile.getTotalMonthlyIncome() != null && 
            financialProfile.getAnnualIncome() != null && 
            financialProfile.getEmploymentType() != null;
        
        boolean externalComplete = application.getStatus() == ApplicationStatus.READY_FOR_DECISION;
        
        int completionPercentage = 0;
        if (identityComplete) completionPercentage += 20;
        if (documentsComplete) completionPercentage += 30;
        if (employmentComplete) completionPercentage += 20;
        if (financialComplete) completionPercentage += 15;
        if (externalComplete) completionPercentage += 15;
        
        // Determine current stage and next action
        String currentStage = application.getStatus().toString();
        String nextAction = determineNextAction(application.getStatus());
        
        // Build pending and rejected items lists
        List<String> pendingItems = new java.util.ArrayList<>();
        List<String> rejectedItems = new java.util.ArrayList<>();
        
        if (!identityComplete) pendingItems.add("Identity Verification");
        if (!documentsComplete) {
            documents.stream()
                .filter(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.PENDING)
                .forEach(doc -> pendingItems.add("Document: " + doc.getDocumentType()));
            
            documents.stream()
                .filter(doc -> doc.getVerificationStatus() == com.tss.loan.entity.enums.VerificationStatus.REJECTED)
                .forEach(doc -> rejectedItems.add("Document: " + doc.getDocumentType()));
        }
        if (!employmentComplete) pendingItems.add("Employment Verification");
        if (!financialComplete) pendingItems.add("Financial Verification");
        
        return CompleteApplicationDetailsResponse.VerificationSummary.builder()
            .identityVerificationComplete(identityComplete)
            .documentVerificationComplete(documentsComplete)
            .employmentVerificationComplete(employmentComplete)
            .financialVerificationComplete(financialComplete)
            .externalVerificationComplete(externalComplete)
            .overallCompletionPercentage(completionPercentage)
            .currentStage(currentStage)
            .nextAction(nextAction)
            .pendingItems(pendingItems)
            .rejectedItems(rejectedItems)
            .readyForExternalVerification(identityComplete && documentsComplete && employmentComplete && financialComplete)
            .readyForDecision(externalComplete)
            .build();
    }
    
    private String determineNextAction(ApplicationStatus status) {
        switch (status) {
            case UNDER_REVIEW:
                return "START_DOCUMENT_VERIFICATION";
            case DOCUMENT_VERIFICATION:
                return "COMPLETE_DOCUMENT_VERIFICATION";
            case PENDING_EXTERNAL_VERIFICATION:
                return "TRIGGER_EXTERNAL_VERIFICATION";
            case FRAUD_CHECK:
                return "WAIT_FOR_EXTERNAL_VERIFICATION";
            case READY_FOR_DECISION:
                return "MAKE_FINAL_DECISION";
            default:
                return "REVIEW_APPLICATION";
        }
    }
    
    private java.math.BigDecimal calculateEMI(java.math.BigDecimal principal, Integer tenureMonths) {
        if (principal == null || tenureMonths == null || tenureMonths == 0) {
            return java.math.BigDecimal.ZERO;
        }
        
        double monthlyRate = 12.0 / 100 / 12; // Assuming 12% annual interest rate
        double emi = principal.doubleValue() * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) / 
                    (Math.pow(1 + monthlyRate, tenureMonths) - 1);
        
        return java.math.BigDecimal.valueOf(emi).setScale(2, java.math.RoundingMode.HALF_UP);
    }
    
    /**
     * Build comprehensive verification notes from all verification fields
     */
    private String buildVerificationNotes(DocumentVerificationRequest request) {
        StringBuilder notes = new StringBuilder();
        
        // Identity verification
        if (request.getIdentityVerificationNotes() != null && !request.getIdentityVerificationNotes().trim().isEmpty()) {
            notes.append("Identity: ").append(request.getIdentityVerificationNotes()).append("; ");
        }
        
        // Employment verification
        if (request.getEmploymentVerificationNotes() != null && !request.getEmploymentVerificationNotes().trim().isEmpty()) {
            notes.append("Employment: ").append(request.getEmploymentVerificationNotes()).append("; ");
        }
        
        // Income verification
        if (request.getIncomeVerificationNotes() != null && !request.getIncomeVerificationNotes().trim().isEmpty()) {
            notes.append("Income: ").append(request.getIncomeVerificationNotes()).append("; ");
        }
        
        // Bank account verification
        if (request.getBankAccountVerificationNotes() != null && !request.getBankAccountVerificationNotes().trim().isEmpty()) {
            notes.append("Bank Account: ").append(request.getBankAccountVerificationNotes()).append("; ");
        }
        
        // General notes
        if (request.getGeneralNotes() != null && !request.getGeneralNotes().trim().isEmpty()) {
            notes.append("General: ").append(request.getGeneralNotes()).append("; ");
        }
        
        // Remove trailing "; " if present
        String result = notes.toString();
        if (result.endsWith("; ")) {
            result = result.substring(0, result.length() - 2);
        }
        
        return result.isEmpty() ? "Verification completed" : result;
    }
        
    /**
     * Save credit score calculation history (MOVED FROM ExternalScoreServiceImpl)
     */
    private void saveCreditScoreHistory(String aadhaar, String pan, Integer creditScore, 
                                       String riskType, Boolean hasDefaults, 
                                       Long activeFraudCases, LocalDateTime calculatedAt) {
        try {
            CreditScoreHistory history = new CreditScoreHistory();
            history.setAadhaarNumber(aadhaar);
            history.setPanNumber(pan);
            history.setCreditScore(creditScore);
            
            // Convert String riskType to enum
            if (riskType != null) {
                try {
                    CreditScoreHistory.RiskScore riskEnum = CreditScoreHistory.RiskScore.valueOf(riskType.toUpperCase());
                    history.setRiskScore(riskEnum);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid risk score value: {}, defaulting to MEDIUM", riskType);
                    history.setRiskScore(CreditScoreHistory.RiskScore.MEDIUM);
                }
            }
            
            // Map hasDefaults to totalDefaults
            if (hasDefaults != null && hasDefaults) {
                history.setTotalDefaults(1); // Indicate presence of defaults
            } else {
                history.setTotalDefaults(0); // No defaults
            }
            
            // Map activeFraudCases to fraudCases
            if (activeFraudCases != null) {
                history.setFraudCases(activeFraudCases.intValue());
            } else {
                history.setFraudCases(0);
            }
            
            // Set computed date (calculatedAt maps to computedDate)
            history.setComputedDate(calculatedAt);
            
            creditScoreHistoryRepository.save(history);
            log.info("Credit score history saved for Aadhaar: {} and PAN: {}", aadhaar, pan);
        } catch (Exception e) {
            log.error("Failed to save credit score history for Aadhaar: {} and PAN: {}", aadhaar, pan, e);
            // Don't throw exception - this is just for audit purposes
        }
    }
    
    /**
     * 🏦 REAL-WORLD BANKING RECOMMENDATION LOGIC
     * Determines recommended action based on credit scoring results
     */
    private String determineRecommendedAction(Integer creditScore, String riskType, Integer riskTypeNumeric, Boolean redAlertFlag) {
        
        // 🚨 RED ALERT - Immediate rejection recommended
        if (redAlertFlag != null && redAlertFlag) {
            return "IMMEDIATE_REJECTION_RECOMMENDED";
        }
        
        // 🔴 HIGH RISK scenarios
        if ("HIGH".equals(riskType) || (riskTypeNumeric != null && riskTypeNumeric >= 70)) {
            if (creditScore == null) {
                // No credit history = Enhanced verification required
                return "ENHANCED_VERIFICATION_REQUIRED";
            } else if (creditScore < 550) {
                // Poor credit score = Reject
                return "REJECTION_RECOMMENDED";
            } else {
                // High risk but some credit history = Manual review
                return "MANUAL_UNDERWRITING_REQUIRED";
            }
        }
        
        // 🟡 MEDIUM RISK scenarios  
        if ("MEDIUM".equals(riskType) || (riskTypeNumeric != null && riskTypeNumeric >= 40 && riskTypeNumeric < 70)) {
            if (creditScore != null && creditScore >= 650) {
                return "CONDITIONAL_APPROVAL_RECOMMENDED";
            } else {
                return "ADDITIONAL_DOCUMENTATION_REQUIRED";
            }
        }
        
        // 🟢 LOW RISK scenarios
        if ("LOW".equals(riskType) || (riskTypeNumeric != null && riskTypeNumeric < 40)) {
            if (creditScore != null && creditScore >= 750) {
                return "FAST_TRACK_APPROVAL_RECOMMENDED";
            } else if (creditScore != null && creditScore >= 650) {
                return "STANDARD_APPROVAL_RECOMMENDED";
            } else {
                return "INCOME_VERIFICATION_REQUIRED";
            }
        }
        
        // 🔄 DEFAULT - Unknown/Error scenarios
        return "MANUAL_REVIEW_REQUIRED";
    }
    
    @Override
    public List<AuditLogResponse> getApplicationAuditTrail(UUID applicationId, User officer) {
        log.info("Getting audit trail for application: {} by officer: {}", applicationId, officer.getEmail());
        
        // Validate application exists and officer has access (throws exception if invalid)
        getApplicationAndValidateOfficer(applicationId, officer);
        
        List<AuditLogResponse> auditTrail = new java.util.ArrayList<>();
        
        // Get audit logs for this application
        List<com.tss.loan.entity.system.AuditLog> auditLogs = auditLogRepository.findByEntityTypeAndEntityIdOrderByTimestampDesc(
            "LoanApplication", 
            applicationId.getMostSignificantBits()
        );
        
        // Convert audit logs to response DTOs
        for (com.tss.loan.entity.system.AuditLog log : auditLogs) {
            AuditLogResponse response = AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .performedBy(log.getUser() != null ? userDisplayService.getDisplayName(log.getUser()) : "System")
                .performedByEmail(log.getUser() != null ? log.getUser().getEmail() : "system@loanscreen.com")
                .timestamp(log.getTimestamp())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId().toString())
                .details(log.getAdditionalInfo())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .changeType("AUDIT_LOG")
                .oldValues(log.getOldValues())
                .newValues(log.getNewValues())
                .additionalInfo(log.getAdditionalInfo())
                .build();
            auditTrail.add(response);
        }
        
        // Get workflow history for this application
        List<com.tss.loan.entity.workflow.ApplicationWorkflow> workflowHistory = 
            applicationWorkflowService.getWorkflowHistory(applicationId);
        
        // Convert workflow history to response DTOs
        for (com.tss.loan.entity.workflow.ApplicationWorkflow workflow : workflowHistory) {
            AuditLogResponse response = AuditLogResponse.builder()
                .id(workflow.getId())
                .action("STATUS_CHANGE")
                .performedBy(workflow.getProcessedBy() != null ? userDisplayService.getDisplayName(workflow.getProcessedBy()) : "System")
                .performedByEmail(workflow.getProcessedBy() != null ? workflow.getProcessedBy().getEmail() : "system@loanscreen.com")
                .timestamp(workflow.getProcessedAt())
                .entityType("LoanApplication")
                .entityId(applicationId.toString())
                .details(String.format("Status changed from %s to %s", workflow.getFromStatus(), workflow.getToStatus()))
                .ipAddress(workflow.getIpAddress())
                .userAgent(workflow.getUserAgent())
                .changeType("WORKFLOW_CHANGE")
                .fromStatus(workflow.getFromStatus().toString())
                .toStatus(workflow.getToStatus().toString())
                .comments(workflow.getComments())
                .systemRemarks(workflow.getSystemRemarks())
                .isSystemGenerated(workflow.getIsSystemGenerated())
                .build();
            auditTrail.add(response);
        }
        
        // Sort by timestamp descending (most recent first)
        auditTrail.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        
        log.info("Retrieved {} audit trail entries for application: {}", auditTrail.size(), applicationId);
        return auditTrail;
    }
}
