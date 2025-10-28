package com.tss.loan.dto.response;

import java.time.LocalDateTime;
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
    
    // Application Statistics
    private int totalAssignedApplications;
    private int pendingReview;
    private int underDocumentVerification;
    private int pendingExternalVerification;
    private int readyForDecision;
    private int completedToday;
    private int completedThisWeek;
    private int completedThisMonth;
    
    // Performance Metrics
    private double averageProcessingTimeHours;
    private int applicationsProcessedToday;
    private int applicationsProcessedThisWeek;
    
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
}
