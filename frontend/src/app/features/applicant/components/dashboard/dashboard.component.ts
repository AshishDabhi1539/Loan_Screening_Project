import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DashboardService, DashboardStats, LoanApplicationSummary } from '../../../../core/services/dashboard.service';
import { UserProfileService, UserProfile } from '../../../../core/services/user-profile.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dashboardService = inject(DashboardService);
  private userProfileService = inject(UserProfileService);

  // Signals for reactive state
  currentUser = this.authService.currentUser;
  userProfile = signal<UserProfile | null>(null);
  isLoading = signal(false);
  dashboardStats = signal<DashboardStats>({
    totalApplications: 0,
    activeApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    pendingAmount: 0,
    approvedAmount: 0
  });

  recentApplications = signal<LoanApplicationSummary[]>([]);
  
  // Computed values
  userDisplayName = computed(() => {
    const profile = this.userProfile();
    if (profile) {
      return this.userProfileService.getDisplayName(profile);
    }
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || 'User';
  });

  canApplyForLoan = computed(() => {
    const profile = this.userProfile();
    return profile ? this.userProfileService.canUserApplyForLoan(profile) : false;
  });

  profileCompletionPercentage = computed(() => {
    const profile = this.userProfile();
    return this.userProfileService.getProfileCompletionPercentage(profile || undefined);
  });

  hasApplications = computed(() => this.dashboardStats().totalApplications > 0);
  
  pendingApplications = computed(() => 
    this.recentApplications().filter(app => 
      ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS'].includes(app.status)
    )
  );

  ngOnInit(): void {
    this.loadUserProfile();
    this.loadDashboardData();
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(): void {
    // Get profile status from backend
    this.userProfileService.getCurrentUserProfile().subscribe({
      next: (profile) => {
        // Merge with current user data from AuthService
        const currentUser = this.currentUser();
        if (currentUser) {
          const mergedProfile: UserProfile = {
            ...profile,
            id: currentUser.id || 'current-user',
            email: currentUser.email || 'user@example.com',
            role: currentUser.role || 'APPLICANT',
            status: currentUser.status || 'ACTIVE',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
          };
          this.userProfile.set(mergedProfile);
        } else {
          this.userProfile.set(profile);
        }
      },
      error: (error) => {
        console.error('Failed to load user profile:', error);
        // Create fallback profile from currentUser
        const currentUser = this.currentUser();
        if (currentUser) {
          const fallbackProfile: UserProfile = {
            id: currentUser.id || 'current-user',
            email: currentUser.email || 'user@example.com',
            role: currentUser.role || 'APPLICANT',
            status: currentUser.status || 'ACTIVE',
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            hasPersonalDetails: false, // Assume false on error
            requiresPersonalDetails: true,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
          this.userProfile.set(fallbackProfile);
        }
      }
    });
  }

  /**
   * Load dashboard data from backend API
   */
  private loadDashboardData(): void {
    this.isLoading.set(true);
    
    // Load dashboard data from backend
    this.dashboardService.getDashboardData().subscribe({
      next: (data) => {
        this.dashboardStats.set(data.stats);
        this.recentApplications.set(data.recentApplications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load dashboard data:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data. Please try again.');
        this.isLoading.set(false);
        
        // Set empty data on error
        this.dashboardStats.set({
          totalApplications: 0,
          activeApplications: 0,
          approvedApplications: 0,
          rejectedApplications: 0,
          pendingAmount: 0,
          approvedAmount: 0
        });
        this.recentApplications.set([]);
      }
    });
  }

  /**
   * Get status display text
   */
  getStatusDisplay(status: string): string {
    return this.dashboardService.getStatusDisplay(status);
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    return this.dashboardService.getStatusBadgeColor(status);
  }

  /**
   * Get loan type display text
   */
  getLoanTypeDisplay(loanType: string): string {
    return this.dashboardService.getLoanTypeDisplay(loanType);
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return this.dashboardService.formatDate(date);
  }

  /**
   * Navigate to new loan application
   */
  startNewApplication(): void {
    const profile = this.userProfile();
    if (!this.canApplyForLoan()) {
      if (!profile?.hasPersonalDetails) {
        this.notificationService.warning('Profile Incomplete', 'Please complete your personal details before applying for a loan.');
        // TODO: Navigate to profile completion page
        return;
      }
      this.notificationService.warning('Cannot Apply', 'You are not eligible to apply for a loan at this time.');
      return;
    }
    
    this.notificationService.info('New Application', 'Starting new loan application process...');
    // Router navigation will be handled by routerLink in template
  }

  /**
   * View application details
   */
  viewApplication(applicationId: string): void {
    // Navigate to employment details to continue the application
    this.router.navigate(['/applicant/employment-details'], {
      queryParams: { applicationId: applicationId }
    });
  }

  /**
   * Upload documents for application
   */
  uploadDocuments(applicationId: string): void {
    this.notificationService.info('Document Upload', `Opening document upload for application ${applicationId}...`);
    // Router navigation will be handled by routerLink in template
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.notificationService.info('Refreshing', 'Updating dashboard data...');
    this.testBackendConnection();
    this.loadUserProfile();
    this.loadDashboardData();
  }

  /**
   * Test backend connection
   */
  testBackendConnection(): void {
    console.log('🔍 Testing backend connection...');
    console.log('Current user from AuthService:', this.currentUser());
    console.log('Is authenticated:', this.authService.isAuthenticated());
    console.log('Stored token:', this.authService.getStoredToken() ? 'Present' : 'Missing');
    
    // Test API call through dashboard service
    this.dashboardService.getDashboardStats().subscribe({
      next: (stats) => {
        console.log('✅ Dashboard stats test successful:', stats);
      },
      error: (error) => {
        console.error('❌ Dashboard stats test failed:', error);
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
   * Get progress percentage for application
   */
  getApplicationProgress(application: LoanApplicationSummary): number {
    // Use progress from backend if available, otherwise calculate from status
    return application.progress || this.calculateProgressFromStatus(application.status);
  }

  /**
   * Calculate progress from status (fallback method)
   */
  private calculateProgressFromStatus(status: string): number {
    switch (status) {
      case 'DRAFT':
        return 10;
      case 'SUBMITTED':
        return 25;
      case 'UNDER_REVIEW':
        return 50;
      case 'PENDING_DOCUMENTS':
        return 40;
      case 'FLAGGED_FOR_COMPLIANCE':
      case 'COMPLIANCE_REVIEW':
        return 60;
      case 'READY_FOR_DECISION':
        return 80;
      case 'APPROVED':
      case 'DISBURSED':
        return 100;
      case 'REJECTED':
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Check if application needs action
   */
  needsAction(application: LoanApplicationSummary): boolean {
    return ['DRAFT', 'PENDING_DOCUMENTS', 'APPROVED'].includes(application.status);
  }
}