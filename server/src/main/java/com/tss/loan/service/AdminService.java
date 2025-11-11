package com.tss.loan.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
}
