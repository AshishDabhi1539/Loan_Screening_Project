import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of, forkJoin, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { 
  AdminStats, 
  OfficerResponse, 
  UserResponse, 
  OfficerDetailsResponse, 
  OfficerCreationRequest,
  SystemStats,
  RecentActivity,
  DashboardAnalytics
} from '../models/admin.model';
import { CompleteApplicationDetailsResponse } from '../models/officer.model';
import { LoanApplicationResponse } from '../models/loan-application.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  /**
   * Check if user is authenticated before making API calls
   */
  private checkAuthentication(): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, skipping API call');
      return throwError(() => new Error('User not authenticated'));
    }
    return of(true);
  }

  /**
   * Get all officers from backend
   */
  getAllOfficers(): Observable<OfficerResponse[]> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.apiService.get<OfficerResponse[]>('/admin/officers');
  }

  /**
   * Get officer details by ID (comprehensive)
   */
  getOfficerById(officerId: string): Observable<OfficerDetailsResponse> {
    return this.apiService.get<OfficerDetailsResponse>(`/admin/officers/${officerId}`);
  }

  /**
   * Get officer's assigned applications
   */
  getOfficerAssignedApplications(officerId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/admin/officers/${officerId}/applications`);
  }

  /**
   * Toggle officer status (soft delete with validation)
   * Backend returns plain text string, not JSON
   */
  toggleOfficerStatus(officerId: string): Observable<string> {
    return this.apiService.post<string>(`/admin/officers/${officerId}/toggle-status`, {}).pipe(
      map(response => {
        console.log('✅ Toggle status response:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Toggle status API error:', error);
        throw error;
      })
    );
  }

  /**
   * Get all users from backend
   */
  getAllUsers(): Observable<UserResponse[]> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }
    return this.apiService.get<UserResponse[]>('/admin/users');
  }

  /**
   * Get applicant details by ID
   */
  getApplicantById(applicantId: string): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/admin/applicants/${applicantId}`);
  }

  /**
   * Get applicant's loan applications
   */
  getApplicantApplications(applicantId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/admin/applicants/${applicantId}/applications`);
  }

  /**
   * Create a new officer
   */
  createOfficer(request: OfficerCreationRequest): Observable<string> {
    return this.apiService.post<string>('/admin/create-officer', request);
  }

  /**
   * Get system statistics for admin dashboard
   * This combines multiple API calls to build comprehensive stats
   */
  getSystemStats(): Observable<SystemStats> {
    // Combine multiple API calls to calculate real stats
    return forkJoin({
      officers: this.getAllOfficers().pipe(catchError(() => of([]))),
      users: this.getAllUsers().pipe(catchError(() => of([]))),
      // applications: this.getAllApplications().pipe(catchError(() => of([]))) // TODO: Add when available
    }).pipe(
      map(({ officers, users }) => {
        // Calculate stats from real data
        const activeUsers = users.filter(user => user.status === 'ACTIVE').length;
        
        return {
          totalUsers: users.length,
          totalOfficers: officers.length,
          totalApplications: 0, // Will be updated when application API is available
          pendingApplications: 0, // Will be updated when application API is available
          approvedApplications: 0, // Will be updated when application API is available
          rejectedApplications: 0, // Will be updated when application API is available
          activeUsers: activeUsers
        };
      }),
      catchError(error => {
        console.error('Error fetching system stats:', error);
        // Return empty stats on error
        return of({
          totalUsers: 0,
          totalOfficers: 0,
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          activeUsers: 0
        });
      })
    );
  }

  /**
   * Get admin dashboard data from backend
   */
  getAdminDashboardData(): Observable<{ stats: AdminStats; recentActivities: RecentActivity[] }> {
    // Check authentication first
    if (!this.authService.isAuthenticated()) {
      console.log('User not authenticated, returning empty dashboard data');
      return throwError(() => new Error('User not authenticated'));
    }

    // Fetch both stats and activities in parallel
    return forkJoin({
      stats: this.apiService.get<any>('/admin/dashboard'),
      activities: this.apiService.get<RecentActivity[]>('/admin/recent-activities').pipe(
        catchError(() => of([]))
      )
    }).pipe(
      map(({ stats: backendStats, activities }) => ({
        stats: {
          totalUsers: backendStats.totalUsers || 0,
          totalOfficers: backendStats.totalOfficers || 0,
          complianceOfficers: backendStats.complianceOfficers || 0,
          totalApplicants: backendStats.totalApplicants || 0,
          totalApplications: backendStats.totalApplications || 0,
          pendingApplications: backendStats.pendingApplications || 0,
          approvedApplications: backendStats.approvedApplications || 0,
          rejectedApplications: backendStats.rejectedApplications || 0,
          activeUsers: backendStats.activeUsers || 0,
          systemHealth: backendStats.systemHealth || 'good'
        },
        recentActivities: activities
      })),
      catchError(error => {
        console.error('Error fetching admin dashboard:', error);
        // Fallback to old method if backend fails
        return this.getSystemStats().pipe(
          map(stats => ({
            stats: {
              ...stats,
              systemHealth: this.calculateSystemHealth(stats)
            },
            recentActivities: []
          }))
        );
      })
    );
  }

  /**
   * Get recent applications for admin dashboard (last 5)
   */
  getRecentApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>('/admin/recent-applications').pipe(
      catchError(error => {
        console.error('Error fetching recent applications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all applications for admin (for "View All" page)
   */
  getAllApplications(): Observable<LoanApplicationResponse[]> {
    return this.apiService.get<LoanApplicationResponse[]>('/admin/applications').pipe(
      catchError(error => {
        console.error('Error fetching all applications:', error);
        return of([]);
      })
    );
  }

  /**
   * Get complete application details for admin (read-only view)
   */
  getApplicationDetails(applicationId: string): Observable<CompleteApplicationDetailsResponse> {
    return this.apiService.get<CompleteApplicationDetailsResponse>(`/admin/applications/${applicationId}`);
  }

  /**
   * Get audit trail for an application (admin view)
   */
  getAuditTrail(applicationId: string): Observable<any[]> {
    return this.apiService.get<any[]>(`/admin/applications/${applicationId}/audit-trail`);
  }

  /**
   * Calculate system health based on stats
   */
  private calculateSystemHealth(stats: SystemStats): 'good' | 'warning' | 'critical' {
    // Simple health calculation logic
    if (stats.totalOfficers === 0) {
      return 'critical';
    }
    if (stats.pendingApplications > 50) {
      return 'warning';
    }
    return 'good';
  }

  /**
   * Get comprehensive dashboard analytics
   */
  getDashboardAnalytics(): Observable<DashboardAnalytics> {
    return this.apiService.get<DashboardAnalytics>('/admin/analytics').pipe(
      catchError(error => {
        console.error('Error fetching dashboard analytics:', error);
        return of(this.getEmptyDashboardAnalytics());
      })
    );
  }

  /**
   * Get financial analytics
   */
  getFinancialAnalytics(): Observable<any> {
    return this.apiService.get<any>('/admin/analytics/financial').pipe(
      catchError(error => {
        console.error('Error fetching financial analytics:', error);
        return of({});
      })
    );
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Observable<any> {
    return this.apiService.get<any>('/admin/analytics/performance').pipe(
      catchError(error => {
        console.error('Error fetching performance metrics:', error);
        return of({});
      })
    );
  }

  /**
   * Get trend analytics
   */
  getTrendAnalytics(period: string = 'month'): Observable<any> {
    return this.apiService.get<any>(`/admin/analytics/trends?period=${period}`).pipe(
      catchError(error => {
        console.error('Error fetching trend analytics:', error);
        return of({});
      })
    );
  }

  /**
   * Test admin API connection
   */
  testConnection(): Observable<any> {
    return this.getAllOfficers().pipe(
      map(officers => ({
        status: 'success',
        message: 'Admin API connection successful',
        data: { officerCount: officers.length }
      })),
      catchError(error => {
        console.error('Admin API connection failed:', error);
        return of({
          status: 'error',
          message: 'Admin API connection failed',
          error: error.message
        });
      })
    );
  }

  /**
   * Get empty dashboard analytics for error cases
   */
  private getEmptyDashboardAnalytics(): DashboardAnalytics {
    return {
      keyMetrics: {
        newApplicationsThisMonth: 0,
        newApplicationsGrowth: 0,
        activeOfficers: 0,
        activeOfficersGrowth: 0,
        pendingReviews: 0,
        pendingReviewsChange: 0,
        approvalRateThisMonth: 0,
        approvalRateChange: 0
      },
      chartData: {
        applicationStatusDistribution: {},
        monthlyApplicationTrends: [],
        dailyUserActivity: [],
        officerPerformance: []
      },
      performanceData: {
        averageProcessingTimeDays: 0,
        averageApprovalTimeDays: 0,
        systemUptimePercentage: 99.9,
        totalActiveUsers: 0,
        totalSystemTransactions: 0
      },
      financialData: {
        totalLoanAmountRequested: 0,
        totalLoanAmountApproved: 0,
        totalLoanAmountDisbursed: 0,
        averageLoanAmount: 0,
        disbursementRate: 0
      },
      riskData: {
        highRiskApplications: 0,
        mediumRiskApplications: 0,
        lowRiskApplications: 0,
        fraudDetectionRate: 0,
        totalFraudCases: 0
      }
    };
  }

  // TODO: Add these methods when backend APIs are available
  
  /**
   * Get all users (to be implemented when backend API is ready)
   */
  // getAllUsers(): Observable<UserResponse[]> {
  //   return this.apiService.get<UserResponse[]>('/admin/users');
  // }

  /**
   * Get all applications (to be implemented when backend API is ready)
   */
  // getAllApplications(): Observable<any[]> {
  //   return this.apiService.get<any[]>('/admin/applications');
  // }

  /**
   * Get recent activities (to be implemented when backend API is ready)
   */
  // getRecentActivities(): Observable<RecentActivity[]> {
  //   return this.apiService.get<RecentActivity[]>('/admin/activities');
  // }

  /**
   * Update user status (to be implemented when backend API is ready)
   */
  // updateUserStatus(userId: string, status: string): Observable<string> {
  //   return this.apiService.put<string>(`/admin/users/${userId}/status`, { status });
  // }
}
