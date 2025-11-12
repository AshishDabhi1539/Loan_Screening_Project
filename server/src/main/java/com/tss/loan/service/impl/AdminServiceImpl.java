package com.tss.loan.service.impl;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.tss.loan.dto.response.AuditLogResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;
import com.tss.loan.entity.applicant.ApplicantPersonalDetails;
import com.tss.loan.entity.loan.LoanApplication;
import com.tss.loan.entity.enums.ApplicationStatus;
import com.tss.loan.entity.enums.RoleType;
import com.tss.loan.entity.enums.UserStatus;
import com.tss.loan.entity.officer.OfficerPersonalDetails;
import com.tss.loan.entity.system.AuditLog;
import com.tss.loan.entity.user.User;
import com.tss.loan.mapper.LoanApplicationMapper;
import com.tss.loan.repository.ApplicantPersonalDetailsRepository;
import com.tss.loan.repository.AuditLogRepository;
import com.tss.loan.repository.LoanApplicationRepository;
import com.tss.loan.repository.OfficerPersonalDetailsRepository;
import com.tss.loan.repository.UserRepository;
import com.tss.loan.service.AdminService;
import com.tss.loan.service.ApplicationWorkflowService;
import com.tss.loan.service.LoanOfficerService;
import com.tss.loan.service.UserDisplayService;

import lombok.extern.slf4j.Slf4j;

/**
 * Service implementation for admin operations
 * Follows the same pattern as LoanOfficerServiceImpl
 */
@Service
@Slf4j
public class AdminServiceImpl implements AdminService {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    @Autowired
    private ApplicantPersonalDetailsRepository applicantPersonalDetailsRepository;
    
    @Autowired
    private OfficerPersonalDetailsRepository officerPersonalDetailsRepository;
    
    @Autowired
    private LoanApplicationMapper loanApplicationMapper;
    
    @Autowired
    private LoanOfficerService loanOfficerService;
    
    @Autowired
    private ApplicationWorkflowService applicationWorkflowService;
    
    @Autowired
    private UserDisplayService userDisplayService;
    
    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStatistics() {
        log.info("Fetching admin dashboard statistics");
        
        // Use COUNT queries to avoid N+1 problem
        long totalUsers = userRepository.count();
        long totalOfficers = userRepository.countByRoleIn(
            Arrays.asList(
                RoleType.LOAN_OFFICER,
                RoleType.SENIOR_LOAN_OFFICER,
                RoleType.COMPLIANCE_OFFICER,
                RoleType.SENIOR_COMPLIANCE_OFFICER
            )
        );
        
        // Separate counts for different officer types
        long complianceOfficers = userRepository.countByRoleIn(
            Arrays.asList(
                RoleType.COMPLIANCE_OFFICER,
                RoleType.SENIOR_COMPLIANCE_OFFICER
            )
        );
        
        long totalApplicants = userRepository.countByRole(RoleType.APPLICANT);
        long totalApplications = loanApplicationRepository.count();
        
        // Count by status using repository methods - ALL statuses that are "in progress"
        long pendingApplications = loanApplicationRepository.countByStatusIn(
            Arrays.asList(
                ApplicationStatus.DRAFT,
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.DOCUMENT_VERIFICATION,
                ApplicationStatus.DOCUMENT_INCOMPLETE,
                ApplicationStatus.DOCUMENT_REVERIFICATION,
                ApplicationStatus.FINANCIAL_REVIEW,
                ApplicationStatus.CREDIT_CHECK,
                ApplicationStatus.EMPLOYMENT_VERIFICATION,
                ApplicationStatus.RISK_ASSESSMENT,
                ApplicationStatus.FRAUD_CHECK,
                ApplicationStatus.UNDER_INVESTIGATION,
                ApplicationStatus.COLLATERAL_VERIFICATION,
                ApplicationStatus.UNDER_REVIEW,
                ApplicationStatus.PENDING_EXTERNAL_VERIFICATION,
                ApplicationStatus.READY_FOR_DECISION,
                ApplicationStatus.FLAGGED_FOR_COMPLIANCE,
                ApplicationStatus.COMPLIANCE_REVIEW,
                ApplicationStatus.PENDING_COMPLIANCE_DOCS,
                ApplicationStatus.AWAITING_COMPLIANCE_DECISION,
                ApplicationStatus.COMPLIANCE_TIMEOUT,
                ApplicationStatus.MANAGER_APPROVAL,
                ApplicationStatus.PRE_APPROVED,
                ApplicationStatus.DOCUMENTATION,
                ApplicationStatus.DISBURSEMENT_PENDING,
                ApplicationStatus.ON_HOLD
            )
        );
        
        long approvedApplications = loanApplicationRepository.countByStatusIn(
            Arrays.asList(
                ApplicationStatus.APPROVED,
                ApplicationStatus.DISBURSED
            )
        );
        long rejectedApplications = loanApplicationRepository.countByStatusIn(
            Arrays.asList(
                ApplicationStatus.REJECTED,
                ApplicationStatus.CANCELLED,
                ApplicationStatus.EXPIRED
            )
        );
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        
        // Build response
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalOfficers", totalOfficers);
        stats.put("complianceOfficers", complianceOfficers);
        stats.put("totalApplicants", totalApplicants);
        stats.put("totalApplications", totalApplications);
        stats.put("pendingApplications", pendingApplications);
        stats.put("approvedApplications", approvedApplications);
        stats.put("rejectedApplications", rejectedApplications);
        stats.put("activeUsers", activeUsers);
        stats.put("systemHealth", pendingApplications > 50 ? "warning" : "good");
        
        log.info("Admin dashboard stats: {} users, {} officers ({} compliance), {} applicants, {} applications ({}+{}+{}={})", 
                totalUsers, totalOfficers, complianceOfficers, totalApplicants, totalApplications,
                pendingApplications, approvedApplications, rejectedApplications, 
                (pendingApplications + approvedApplications + rejectedApplications));
        
        return stats;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRecentActivities() {
        try {
            // Get last 50 audit logs from the past 30 days
            Pageable pageable = PageRequest.of(0, 50);
            LocalDateTime fromDate = LocalDateTime.now().minusDays(30);
            Page<AuditLog> auditLogs = auditLogRepository.findRecentActivities(fromDate, pageable);
            
            // Filter and map to important activities only
            List<Map<String, Object>> activities = auditLogs.getContent().stream()
                .filter(this::isImportantActivity)
                .limit(10)
                .map(auditLog -> {
                    Map<String, Object> activity = new HashMap<>();
                    activity.put("id", auditLog.getId());
                    activity.put("action", auditLog.getAction());
                    activity.put("type", auditLog.getAction());
                    activity.put("description", formatActivityDescription(auditLog));
                    activity.put("timestamp", auditLog.getTimestamp());
                    activity.put("entityType", auditLog.getEntityType());
                    activity.put("userName", getUserNameFromLog(auditLog));
                    activity.put("userType", getUserTypeFromLog(auditLog));
                    return activity;
                })
                .collect(Collectors.toList());
            
            return activities;
            
        } catch (Exception e) {
            log.error("Error fetching recent activities: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
    
    /**
     * Check if activity is important enough to show on dashboard
     * Only shows critical business activities (no logins, logouts, or profile updates)
     */
    private boolean isImportantActivity(AuditLog auditLog) {
        if (auditLog == null || auditLog.getAction() == null) {
            return false;
        }
        
        String action = auditLog.getAction();
        
        // Only CRITICAL business activities for admin dashboard
        return action.equals("USER_REGISTRATION") ||
               action.equals("OFFICER_CREATED") ||
               action.equals("LOAN_APPLICATION_SUBMITTED") ||
               action.equals("APPLICATION_SUBMITTED") ||
               action.equals("APPLICATION_APPROVED") ||
               action.equals("APPLICATION_REJECTED") ||
               action.equals("STATUS_CHANGED") ||
               action.equals("DOCUMENT_UPLOADED") ||
               action.equals("COMPLIANCE_REVIEW_COMPLETED") ||
               action.equals("DECISION_MADE");
    }
    
    /**
     * Get user name from audit log
     * Follows same pattern as other services
     */
    private String getUserNameFromLog(AuditLog auditLog) {
        if (auditLog.getUser() != null) {
            User user = auditLog.getUser();
            
            // For applicants, get from personal details
            if ("APPLICANT".equals(user.getRole().toString())) {
                Optional<ApplicantPersonalDetails> details = 
                    applicantPersonalDetailsRepository.findByUserId(user.getId());
                if (details.isPresent()) {
                    return details.get().getFullName();
                }
            }
            // For officers, get from officer details
            else if (user.getRole().toString().contains("OFFICER")) {
                Optional<OfficerPersonalDetails> details = 
                    officerPersonalDetailsRepository.findByUser(user);
                if (details.isPresent()) {
                    return details.get().getFullName();
                }
            }
            // For admin
            else if ("ADMIN".equals(user.getRole().toString())) {
                return "System Administrator";
            }
            
            // Fallback to email username
            return user.getEmail().split("@")[0];
        }
        return "System";
    }
    
    /**
     * Get user type from audit log for display
     */
    private String getUserTypeFromLog(AuditLog auditLog) {
        if (auditLog.getUser() != null) {
            String role = auditLog.getUser().getRole().toString();
            switch (role) {
                case "APPLICANT": return "Applicant";
                case "LOAN_OFFICER": return "Loan Officer";
                case "SENIOR_LOAN_OFFICER": return "Senior Loan Officer";
                case "COMPLIANCE_OFFICER": return "Compliance Officer";
                case "SENIOR_COMPLIANCE_OFFICER": return "Senior Compliance Officer";
                case "ADMIN": return "Administrator";
                default: return "System";
            }
        }
        return "System";
    }
    
    /**
     * Format activity description for display
     */
    private String formatActivityDescription(AuditLog auditLog) {
        String action = auditLog.getAction();
        String userName = getUserNameFromLog(auditLog);
        String userType = getUserTypeFromLog(auditLog);
        
        switch (action) {
            case "USER_REGISTRATION":
                return userName + " registered as a new applicant";
            case "OFFICER_CREATED":
                return "New " + userType.toLowerCase() + " " + userName + " was created";
            case "LOAN_APPLICATION_SUBMITTED":
            case "APPLICATION_SUBMITTED":
                return userName + " submitted a new loan application";
            case "APPLICATION_APPROVED":
                return "Loan application was approved by " + userName;
            case "APPLICATION_REJECTED":
                return "Loan application was rejected by " + userName;
            case "STATUS_CHANGED":
                return formatStatusChangeDescription(auditLog, userName, userType);
            case "DOCUMENT_UPLOADED":
                return userName + " uploaded verification documents";
            case "COMPLIANCE_REVIEW_COMPLETED":
                return "Compliance review completed by " + userName;
            case "DECISION_MADE":
                return "Final decision made by " + userName;
            default:
                return userName + " - " + action.replace("_", " ").toLowerCase();
        }
    }
    
    /**
     * Format status change description with old → new status
     */
    private String formatStatusChangeDescription(AuditLog auditLog, String userName, String userType) {
        // Extract status from additionalInfo: "Status changed from X to Y for application Z"
        String additionalInfo = auditLog.getAdditionalInfo();
        
        if (additionalInfo != null && additionalInfo.contains("Status changed from")) {
            try {
                int fromIdx = additionalInfo.indexOf("from ") + 5;
                int toIdx = additionalInfo.indexOf(" to ");
                int forIdx = additionalInfo.indexOf(" for ");
                
                if (fromIdx > 5 && toIdx > fromIdx && forIdx > toIdx) {
                    String oldStatus = additionalInfo.substring(fromIdx, toIdx).trim();
                    String newStatus = additionalInfo.substring(toIdx + 4, forIdx).trim();
                    
                    return userName + " changed status: " + formatStatusName(oldStatus) + " → " + formatStatusName(newStatus);
                }
            } catch (Exception e) {
                // Use class logger, not the parameter
                // Silent fail - just return fallback message
            }
        }
        
        // Fallback
        return userName + " changed application status";
    }
    
    /**
     * Format status name for display (convert UNDER_REVIEW to Under Review)
     */
    private String formatStatusName(String status) {
        if (status == null) return "";
        
        // Convert enum format to readable format
        String[] words = status.replace("_", " ").toLowerCase().split(" ");
        StringBuilder result = new StringBuilder();
        
        for (String word : words) {
            if (word.length() > 0) {
                result.append(Character.toUpperCase(word.charAt(0)))
                      .append(word.substring(1))
                      .append(" ");
            }
        }
        
        return result.toString().trim();
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LoanApplicationResponse> getRecentApplications() {
        log.info("Fetching recent 5 applications for admin dashboard");
        
        // Get last 5 applications (all statuses) ordered by creation date
        Pageable pageable = PageRequest.of(0, 5);
        Page<LoanApplication> applications = loanApplicationRepository.findAllByOrderByCreatedAtDesc(pageable);
        
        log.info("Found {} recent applications for admin", applications.getContent().size());
        
        return applications.getContent().stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<LoanApplicationResponse> getAllApplications() {
        log.info("Fetching all applications for admin");
        
        // Get all applications ordered by creation date (newest first)
        List<LoanApplication> applications = loanApplicationRepository.findAllByOrderByCreatedAtDesc();
        
        log.info("Found {} total applications for admin", applications.size());
        
        return applications.stream()
            .map(loanApplicationMapper::toResponse)
            .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public CompleteApplicationDetailsResponse getApplicationDetails(UUID applicationId) {
        log.info("Admin requesting complete details for application: {}", applicationId);
        
        // Admin can view any application (no officer validation)
        // Reuse the internal method from LoanOfficerService that doesn't require officer validation
        CompleteApplicationDetailsResponse response = loanOfficerService.getCompleteApplicationDetailsInternal(applicationId);
        
        log.info("Successfully retrieved application details for admin: {}", applicationId);
        
        return response;
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> getApplicationAuditTrail(UUID applicationId) {
        log.info("Admin requesting audit trail for application: {}", applicationId);
        
        // Validate application exists
        loanApplicationRepository.findById(applicationId)
            .orElseThrow(() -> new RuntimeException("Application not found: " + applicationId));
        
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
        
        // Sort by timestamp descending (most recent first) - NO FILTERING for admin
        auditTrail.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
        
        log.info("Retrieved {} audit trail entries for application: {} (Admin view - no filtering)", auditTrail.size(), applicationId);
        return auditTrail;
    }
}
