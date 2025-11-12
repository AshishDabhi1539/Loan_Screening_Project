package com.tss.loan.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.tss.loan.dto.response.AuditLogResponse;
import com.tss.loan.dto.response.CompleteApplicationDetailsResponse;
import com.tss.loan.dto.response.LoanApplicationResponse;

/**
 * Service for admin operations
 * Follows the same pattern as LoanOfficerService
 */
public interface AdminService {
    
    /**
     * Get dashboard statistics for admin
     * @return Dashboard statistics map
     */
    Map<String, Object> getDashboardStatistics();
    
    /**
     * Get recent activities for admin dashboard
     * Returns last 10 important activities with user categorization
     * @return List of recent activities with user type information
     */
    List<Map<String, Object>> getRecentActivities();
    
    /**
     * Get recent applications for admin dashboard
     * Returns last 5 applications (all statuses) for oversight
     * @return List of recent loan applications
     */
    List<LoanApplicationResponse> getRecentApplications();
    
    /**
     * Get all applications for admin (for "View All" page)
     * @return List of all loan applications
     */
    List<LoanApplicationResponse> getAllApplications();
    
    /**
     * Get complete application details for admin (read-only view)
     * Admin can view all details but cannot perform actions
     * @param applicationId The application ID
     * @return Complete application details
     */
    CompleteApplicationDetailsResponse getApplicationDetails(UUID applicationId);
    
    /**
     * Get audit trail for an application (admin view)
     * Admin can view all audit logs and workflow history without restrictions
     * @param applicationId The application ID
     * @return List of audit log entries
     */
    List<AuditLogResponse> getApplicationAuditTrail(UUID applicationId);
    
    /**
     * Get comprehensive dashboard analytics
     * Includes key metrics, charts data, performance metrics, and financial data
     * @return Complete dashboard analytics
     */
    com.tss.loan.dto.response.DashboardAnalytics getDashboardAnalytics();
    
    /**
     * Get financial analytics for admin dashboard
     * @return Financial statistics and trends
     */
    Map<String, Object> getFinancialAnalytics();
    
    /**
     * Get performance metrics for system monitoring
     * @return System performance data
     */
    Map<String, Object> getPerformanceMetrics();
    
    /**
     * Get trend analysis for specified period
     * @param period The period for analysis (week, month, quarter, year)
     * @return Trend analysis data
     */
    Map<String, Object> getTrendAnalytics(String period);
}
