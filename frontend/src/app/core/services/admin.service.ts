import { Injectable, inject } from '@angular/core';
import { Observable, map, catchError, of, forkJoin } from 'rxjs';
import { ApiService } from './api.service';

// Admin-specific interfaces
export interface AdminStats {
  totalUsers: number;
  totalOfficers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  systemHealth: 'good' | 'warning' | 'critical';
  activeUsers: number;
}

export interface OfficerResponse {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt?: string;
  displayName?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  phone?: string;
  role: string;
  status: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
  displayName?: string;
}

export interface OfficerCreationRequest {
  email: string;
  phone: string;
  role: 'LOAN_OFFICER' | 'COMPLIANCE_OFFICER';
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  department?: string;
  designation?: string;
  phoneNumber?: string;
  workLocation?: string;
}

export interface SystemStats {
  totalUsers: number;
  totalOfficers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeUsers: number;
}

export interface RecentActivity {
  id: string;
  type: 'USER_REGISTRATION' | 'OFFICER_CREATED' | 'APPLICATION_SUBMITTED' | 'APPLICATION_APPROVED' | 'APPLICATION_REJECTED';
  description: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiService = inject(ApiService);

  /**
   * Get all officers from backend
   */
  getAllOfficers(): Observable<OfficerResponse[]> {
    return this.apiService.get<OfficerResponse[]>('/admin/officers');
  }

  /**
   * Get all users from backend
   */
  getAllUsers(): Observable<UserResponse[]> {
    return this.apiService.get<UserResponse[]>('/admin/users');
  }

  /**
   * Get applicant details by ID
   */
  getApplicantById(applicantId: string): Observable<UserResponse> {
    return this.apiService.get<UserResponse>(`/admin/applicants/${applicantId}`);
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
   * Get admin dashboard data
   */
  getAdminDashboardData(): Observable<{ stats: AdminStats; recentActivities: RecentActivity[] }> {
    return this.getSystemStats().pipe(
      map(stats => ({
        stats: {
          ...stats,
          systemHealth: this.calculateSystemHealth(stats)
        },
        recentActivities: [] // Will be populated when activity log API is available
      }))
    );
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
