package com.tss.loan.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComplianceDashboardResponse {
    
    // Officer Information
    private UUID officerId;
    private String officerName;
    private String officerEmail;
    private String role;
    
    // Workload Statistics
    private int totalAssignedApplications;
    private int flaggedForCompliance;
    private int underComplianceReview;
    private int pendingComplianceDocs;
    private int completedToday;
    private int completedThisWeek;
    private int completedThisMonth;
    
    // Priority Breakdown
    private int criticalPriorityApplications;
    private int highPriorityApplications;
    private int mediumPriorityApplications;
    private int lowPriorityApplications;
    
    // Performance Metrics
    private double averageResolutionTimeHours;
    private int totalCasesResolved;
    private int complianceViolationsFound;
    private int applicationsClearedToday;
    
    // Recent Activity
    private List<RecentComplianceActivity> recentActivities;
    
    // System Statistics
    private int totalSystemFlaggedApplications;
    private int availableComplianceOfficers;
    private boolean hasCapacityForNewCases;
    
    // Dashboard Metadata
    private LocalDateTime lastUpdated;
    private String dashboardVersion;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentComplianceActivity {
        private UUID applicationId;
        private String applicantName;
        private String action;
        private String status;
        private String flagReason;
        private String priority;
        private LocalDateTime timestamp;
        private String description;
    }
}
