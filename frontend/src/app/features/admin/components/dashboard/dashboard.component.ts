import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminStats, RecentActivity } from '../../../../core/models/admin.model';
import { LoanApplicationResponse } from '../../../../core/models/loan-application.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);
  private router = inject(Router);

  // Signals for reactive state
  currentUser = this.authService.currentUser;
  
  // Signals for reactive data
  adminStats = signal<AdminStats>({
    totalUsers: 0,
    totalOfficers: 0,
    complianceOfficers: 0,
    totalApplicants: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    systemHealth: 'good',
    activeUsers: 0
  });
  
  // New comprehensive analytics
  dashboardAnalytics = signal<any>(null); // Using any for now to avoid TypeScript issues
  
  recentActivities = signal<RecentActivity[]>([]);
  recentApplications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(true);
  isAnalyticsLoading = signal(true);

  // Computed values
  userDisplayName = computed(() => {
    const user = this.currentUser();
    if (!user) return 'Admin';
    
    // Extract first and last name only (consistent with other dashboards)
    if (user.displayName) {
      const parts = user.displayName.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0];
      if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
      return user.displayName;
    }
    
    // Fallback to email username
    return user.email?.split('@')[0] || 'Admin';
  });

  systemHealthColor = computed(() => {
    const health = this.adminStats().systemHealth;
    switch (health) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  });

  ngOnInit(): void {
    this.loadAdminData();
    this.loadRecentApplications();
    this.loadDashboardAnalytics();
  }

  /**
   * Load admin dashboard data from backend
   */
  private loadAdminData(): void {
    this.isLoading.set(true);
    
    // Load real data from backend
    this.adminService.getAdminDashboardData().subscribe({
      next: (data) => {
        this.adminStats.set(data.stats);
        this.recentActivities.set(data.recentActivities);
        this.isLoading.set(false);
        console.log('✅ Admin dashboard data loaded successfully:', data);
      },
      error: (error) => {
        console.error('❌ Failed to load admin dashboard data:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
        
        // Set empty data on error
        this.adminStats.set({
          totalUsers: 0,
          totalOfficers: 0,
          complianceOfficers: 0,
          totalApplicants: 0,
          totalApplications: 0,
          pendingApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          systemHealth: 'critical',
          activeUsers: 0
        });
        this.recentActivities.set([]);
      }
    });
  }

  /**
   * Load recent applications (last 5)
   */
  private loadRecentApplications(): void {
    this.adminService.getRecentApplications().subscribe({
      next: (applications) => {
        this.recentApplications.set(applications);
        console.log('✅ Recent applications loaded:', applications);
      },
      error: (error) => {
        console.error('❌ Failed to load recent applications:', error);
        this.recentApplications.set([]);
      }
    });
  }

  /**
   * Load comprehensive dashboard analytics
   */
  private loadDashboardAnalytics(): void {
    this.isAnalyticsLoading.set(true);
    
    this.adminService.getDashboardAnalytics().subscribe({
      next: (analytics) => {
        this.dashboardAnalytics.set(analytics);
        this.isAnalyticsLoading.set(false);
        console.log('✅ Dashboard analytics loaded:', analytics);
      },
      error: (error) => {
        console.error('❌ Failed to load dashboard analytics:', error);
        this.isAnalyticsLoading.set(false);
        // Set empty analytics on error
        this.dashboardAnalytics.set(null);
      }
    });
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    } else if (hour < 17) {
      return 'Good Afternoon';
    } else {
      return 'Good Evening';
    }
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  }

  /**
   * Get relative time (e.g., "2 hours ago")
   */
  getRelativeTime(timestamp: string | Date): string {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    if (isNaN(date.getTime())) return 'Unknown time';
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  }

  /**
   * Get activity icon based on type
   */
  getActivityIcon(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z';
      case 'OFFICER_CREATED':
        return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
      case 'APPLICATION_SUBMITTED':
        return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
      case 'APPLICATION_APPROVED':
        return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'APPLICATION_REJECTED':
        return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'DOCUMENT_UPLOADED':
        return 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12';
      case 'COMPLIANCE_REVIEW_COMPLETED':
        return 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z';
      case 'DECISION_MADE':
        return 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4';
      default:
        return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  /**
   * Get activity color based on type (for circular icon background)
   */
  getActivityColor(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'text-blue-600 bg-blue-50';
      case 'OFFICER_CREATED':
        return 'text-purple-600 bg-purple-50';
      case 'APPLICATION_SUBMITTED':
        return 'text-indigo-600 bg-indigo-50';
      case 'APPLICATION_APPROVED':
        return 'text-green-600 bg-green-50';
      case 'APPLICATION_REJECTED':
        return 'text-red-600 bg-red-50';
      case 'DOCUMENT_UPLOADED':
        return 'text-orange-600 bg-orange-50';
      case 'COMPLIANCE_REVIEW_COMPLETED':
        return 'text-teal-600 bg-teal-50';
      case 'DECISION_MADE':
        return 'text-emerald-600 bg-emerald-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get activity badge color
   */
  getActivityBadgeColor(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'bg-blue-100 text-blue-800';
      case 'OFFICER_CREATED':
        return 'bg-purple-100 text-purple-800';
      case 'APPLICATION_SUBMITTED':
        return 'bg-indigo-100 text-indigo-800';
      case 'APPLICATION_APPROVED':
        return 'bg-green-100 text-green-800';
      case 'APPLICATION_REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DOCUMENT_UPLOADED':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLIANCE_REVIEW_COMPLETED':
        return 'bg-teal-100 text-teal-800';
      case 'DECISION_MADE':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get activity label for badge
   */
  getActivityLabel(type: string): string {
    switch (type) {
      case 'USER_REGISTRATION':
        return 'New User';
      case 'OFFICER_CREATED':
        return 'New Officer';
      case 'APPLICATION_SUBMITTED':
        return 'Application';
      case 'APPLICATION_APPROVED':
        return 'Approved';
      case 'APPLICATION_REJECTED':
        return 'Rejected';
      case 'DOCUMENT_UPLOADED':
        return 'Documents';
      case 'COMPLIANCE_REVIEW_COMPLETED':
        return 'Compliance';
      case 'DECISION_MADE':
        return 'Decision';
      default:
        return 'Activity';
    }
  }

  /**
   * Get status badge color for applications
   */
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DOCUMENT_VERIFICATION':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLIANCE_REVIEW':
        return 'bg-purple-100 text-purple-800';
      case 'READY_FOR_DECISION':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * View application details (admin read-only view)
   */
  viewApplicationDetails(applicationId: string): void {
    this.router.navigate(['/admin/applications', applicationId]);
  }

  /**
   * View all applications
   */
  viewAllApplications(): void {
    this.router.navigate(['/admin/applications']);
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.notificationService.info('Refreshing', 'Updating admin dashboard...');
    this.loadAdminData();
    this.loadRecentApplications();
  }

  /**
   * Test backend connection
   */
  testBackendConnection(): void {
    console.log('🔍 Testing admin backend connection...');
    console.log('Current admin user:', this.currentUser());
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('User role:', this.authService.userRole());
    
    // Test actual API connection
    this.adminService.testConnection().subscribe({
      next: (result) => {
        console.log('✅ Admin API Test Result:', result);
        if (result.status === 'success') {
          this.notificationService.success('API Test', `Connection successful! Found ${result.data?.officerCount || 0} officers.`);
        } else {
          this.notificationService.warning('API Test', result.message);
        }
      },
      error: (error) => {
        console.error('❌ Admin API Test Failed:', error);
        this.notificationService.error('API Test', 'Connection failed. Check console for details.');
      }
    });
  }

  /**
   * Quick action handlers
   */
  createOfficer(): void {
    this.notificationService.info('Create Officer', 'Opening officer creation form...');
    this.router.navigate(['/admin/officers/create']);
  }

  viewAllUsers(): void {
    this.router.navigate(['/admin/users/applicants']);
  }

  viewSystemReports(): void {
    this.router.navigate(['/admin/reports/system']);
  }

  manageSettings(): void {
    this.notificationService.info('Coming Soon', 'System settings feature is under development');
    // TODO: Create settings page and route when needed
  }
}