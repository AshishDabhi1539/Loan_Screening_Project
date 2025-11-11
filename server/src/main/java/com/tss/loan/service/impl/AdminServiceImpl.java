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
import com.tss.loan.service.LoanOfficerService;

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
        long totalApplications = loanApplicationRepository.count();
        
        // Count by status using repository methods
        long pendingApplications = loanApplicationRepository.countByStatusIn(
            Arrays.asList(
                ApplicationStatus.SUBMITTED,
                ApplicationStatus.DOCUMENT_VERIFICATION,
                ApplicationStatus.UNDER_REVIEW,
                ApplicationStatus.READY_FOR_DECISION
            )
        );
        
        long approvedApplications = loanApplicationRepository.countByStatus(ApplicationStatus.APPROVED);
        long rejectedApplications = loanApplicationRepository.countByStatus(ApplicationStatus.REJECTED);
        long activeUsers = userRepository.countByStatus(UserStatus.ACTIVE);
        
        // Build response
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalOfficers", totalOfficers);
        stats.put("totalApplications", totalApplications);
        stats.put("pendingApplications", pendingApplications);
        stats.put("approvedApplications", approvedApplications);
        stats.put("rejectedApplications", rejectedApplications);
        stats.put("activeUsers", activeUsers);
        stats.put("systemHealth", pendingApplications > 50 ? "warning" : "good");
        
        log.info("Admin dashboard stats: {} users, {} officers, {} applications", 
                totalUsers, totalOfficers, totalApplications);
        
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
}
