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
public class OfficerDashboardResponse {
    
    private UUID officerId;
    private String officerName;
    private String officerEmail;
    private String role;
    
    // Application Statistics (matching frontend field names)
    private int totalAssigned; // Frontend expects this name
    private int pendingReview;
    private int underVerification; // Frontend expects this name
    private int pendingExternalVerification;
    private int readyForDecision;
    private int completedToday;
    private int completedThisWeek;
    private int completedThisMonth;
    
    // Performance Metrics
    private double avgProcessingTime; // Frontend expects this name (in hours)
    private int applicationsProcessedToday;
    private int applicationsProcessedThisWeek;
    
    // Priority Breakdown (NEW - required by frontend)
    private PriorityBreakdown priorityBreakdown;
    
    // Recent Applications (NEW - required by frontend)
    private List<LoanApplicationSummary> recentApplications;
    
    // Recent Activities (NEW - required by frontend)
    private List<RecentActivity> recentActivities;
    
    // Recent Activity
    private LocalDateTime lastLoginAt;
    private LocalDateTime lastActivityAt;
    
    // Workload Status
    private boolean hasCapacityForNewApplications;
    private int maxWorkloadCapacity;
    private int currentWorkload;
    
    // Quick Actions Count
    private int urgentApplications;
    private int highValueApplications;
    private int flaggedApplications;
    
    // Nested classes for dashboard data
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriorityBreakdown {
        private int high;
        private int medium;
        private int low;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoanApplicationSummary {
        private String id;
        private String applicantName;
        private String applicantEmail;
        private String loanType;
        private double requestedAmount;
        private String status;
        private String priority;
        private LocalDateTime submittedAt;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentActivity {
        private String id;
        private String action;
        private String applicationId;
        private String applicantName;
        private String status;
        private LocalDateTime timestamp;
        private String performedBy;
    }
}
