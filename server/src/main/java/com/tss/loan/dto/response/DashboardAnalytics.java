package com.tss.loan.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardAnalytics {
    
    // Key Metrics (Top Cards)
    private KeyMetrics keyMetrics;
    
    // Chart Data
    private ChartData chartData;
    
    // Performance Data
    private PerformanceData performanceData;
    
    // Financial Data
    private FinancialData financialData;
    
    // Risk Analytics
    private RiskData riskData;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KeyMetrics {
        private Long newApplicationsThisMonth;
        private Double newApplicationsGrowth; // Percentage change
        
        private Long activeOfficers;
        private Double activeOfficersGrowth;
        
        private Long pendingReviews;
        private Double pendingReviewsChange;
        
        private Double approvalRateThisMonth;
        private Double approvalRateChange;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartData {
        // Application Status Distribution (Donut Chart)
        private Map<String, Long> applicationStatusDistribution;
        
        // Monthly Trends (Line Chart) - Last 12 months
        private List<MonthlyTrend> monthlyApplicationTrends;
        
        // User Activity (Area Chart) - Last 30 days
        private List<DailyActivity> dailyUserActivity;
        
        // Officer Performance (Bar Chart)
        private List<OfficerPerformance> officerPerformance;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceData {
        private Double averageProcessingTimeDays;
        private Double averageApprovalTimeDays;
        private Double systemUptimePercentage;
        private Long totalActiveUsers;
        private Long totalSystemTransactions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class FinancialData {
        private BigDecimal totalLoanAmountRequested;
        private BigDecimal totalLoanAmountApproved;
        private BigDecimal totalLoanAmountDisbursed;
        private BigDecimal averageLoanAmount;
        private Double disbursementRate; // Percentage
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RiskData {
        private Long highRiskApplications;
        private Long mediumRiskApplications;
        private Long lowRiskApplications;
        private Double fraudDetectionRate;
        private Long totalFraudCases;
    }
    
    // Helper Classes for Chart Data
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyTrend {
        private String month; // "2024-01"
        private Long applications;
        private Long approvals;
        private Long rejections;
        private BigDecimal totalAmount;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyActivity {
        private String date; // "2024-01-15"
        private Long userLogins;
        private Long applicationSubmissions;
        private Long officerActions;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OfficerPerformance {
        private String officerName;
        private String officerId;
        private Long applicationsProcessed;
        private Long applicationsApproved;
        private Double approvalRate;
        private Double averageProcessingTime;
    }
}
