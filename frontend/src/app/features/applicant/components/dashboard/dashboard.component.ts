import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardStats, LoanApplicationSummary } from '../../../../core/models/dashboard.model';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { UserProfile } from '../../../../core/models/user.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
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
  activeLoans = signal<LoanApplicationSummary[]>([]);
  profileLoaded = signal(false);
  
  // Computed values - shows only first name and last name
  userDisplayName = computed(() => {
    // Always prioritize currentUser data from AuthService (has actual name from login)
    const user = this.currentUser();
    
    if (user?.displayName && user.displayName !== user.email) {
      const nameParts = user.displayName.trim().split(/\s+/);
      
      if (nameParts.length === 1) {
        // Only one name part (first name)
        return nameParts[0];
      } else if (nameParts.length === 2) {
        // First name and last name
        return `${nameParts[0]} ${nameParts[1]}`;
      } else if (nameParts.length >= 3) {
        // First name, middle name(s), last name - show only first and last
        return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
      }
    }
    
    // Fallback to email username
    return user?.email?.split('@')[0] || 'User';
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
  
  // Show CTA to apply first loan only for new users with completed profile
  showFirstLoanCTA = computed(() => {
    if (!this.profileLoaded()) return false;
    const canApply = this.canApplyForLoan();
    const total = this.dashboardStats()?.totalApplications || 0;
    return canApply && total === 0;
  });
  
  pendingApplications = computed(() => 
    this.recentApplications().filter(app => 
      ['SUBMITTED', 'UNDER_REVIEW', 'PENDING_DOCUMENTS', 'PENDING_COMPLIANCE_DOCS'].includes(app.status)
    )
  );

  applicationsNeedingResubmission = computed(() => 
    this.recentApplications().filter(app => app.status === 'DOCUMENT_INCOMPLETE' || app.status === 'PENDING_COMPLIANCE_DOCS')
  );

  ngOnInit(): void {
    this.checkSubmissionSuccess();
    // Defer data loading until authenticated to avoid 401/refresh loops during app init
    const tryLoad = () => {
      if (this.authService.isAuthenticated()) {
        this.loadUserProfile();
        this.loadDashboardData();
      } else {
        // Re-check shortly until auth state is ready (guard prevents unauth routes)
        setTimeout(tryLoad, 100);
      }
    };
    tryLoad();
  }

  /**
   * Check if user just submitted an application and show success message
   */
  private checkSubmissionSuccess(): void {
    const submitted = this.route.snapshot.queryParams['submitted'];
    
    if (submitted === 'true') {
      // Show success notification
      this.notificationService.success(
        '🎉 Application Submitted!',
        'Your loan application has been submitted successfully and is under review. We will notify you once the verification is complete.'
      );
      
      // Clear query parameter to avoid showing message on refresh
      this.router.navigate([], {
        queryParams: {},
        replaceUrl: true
      });
    }
  }

  /**
   * Load user profile data
   */
  private loadUserProfile(): void {
    this.profileLoaded.set(false);
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
            displayName: profile.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User'
          };
          this.userProfile.set(mergedProfile);
          
          // Update AuthService currentUser with displayName from profile
          if (profile.displayName && profile.displayName !== currentUser.displayName) {
            this.authService.updateCurrentUser({ displayName: profile.displayName });
          }
        } else {
          this.userProfile.set(profile);
        }
        this.profileLoaded.set(true);
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
            hasPersonalDetails: false,
            requiresPersonalDetails: true,
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
          this.userProfile.set(fallbackProfile);
        }
        this.profileLoaded.set(true);
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
        
        // Filter active loans (APPROVED or DISBURSED status)
        const activeLoansList = data.recentApplications.filter(app => 
          app.status === 'APPROVED' || app.status === 'DISBURSED'
        );
        this.activeLoans.set(activeLoansList);
        
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
        this.activeLoans.set([]);
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
   * Start a new loan application with personal details validation
   */
  startNewApplication(): void {
    // Check if personal details are complete before allowing application
    this.userProfileService.hasPersonalDetails().subscribe({
      next: (hasDetails) => {
        if (!hasDetails) {
          this.notificationService.warning(
            'Complete Your Profile First',
            'Please complete your personal details before applying for a loan.'
          );
          
          // Navigate to personal details page
          setTimeout(() => {
            this.router.navigate(['/applicant/personal-details']);
          }, 1500);
        } else {
          // Personal details complete, proceed to loan application
          this.notificationService.success('Profile Complete', 'Redirecting to loan application...');
          setTimeout(() => {
            this.router.navigate(['/applicant/apply-loan']);
          }, 500);
        }
      },
      error: (error) => {
        console.error('Failed to check personal details:', error);
        this.notificationService.error(
          'Error',
          'Failed to verify your profile. Please try again.'
        );
      }
    });
  }

  /**
   * View application details - routes to appropriate step based on progress
   */
  viewApplication(applicationId: string): void {
    // Find the application to check its progress
    const application = this.recentApplications().find(app => app.id === applicationId);
    
    if (!application) {
      this.notificationService.error('Error', 'Application not found');
      return;
    }

    // Route based on application completion status
    this.routeToNextStep(application);
  }

  /**
   * Intelligent routing based on application completion
   */
  private routeToNextStep(application: LoanApplicationSummary): void {
    const appId = application.id;
    
    // Check if application is already submitted
    if (application.status !== 'DRAFT') {
      // For submitted and later states, show details view
      this.router.navigate(['/applicant/application-details', appId]);
      return;
    }

    // For DRAFT status - route to where they left off
    if (!application.hasPersonalDetails) {
      this.notificationService.info('Complete Profile', 'Please complete your personal details first');
      this.router.navigate(['/applicant/personal-details']);
      return;
    }

    if (!application.hasFinancialProfile) {
      this.notificationService.info('Continue Application', 'Please complete employment and financial details');
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: { applicationId: appId }
      });
      return;
    }

    if (!application.documentsCount || application.documentsCount === 0) {
      this.notificationService.info('Upload Documents', 'Please upload required documents');
      this.router.navigate(['/applicant/document-upload'], {
        queryParams: {
          applicationId: appId,
          employmentType: application.employmentType || 'SALARIED'
        }
      });
      return;
    }

    // All steps complete, show summary for final submission
    this.router.navigate(['/applicant/application-details', appId]);
  }

  /**
   * Get appropriate button text based on application status
   */
  getViewButtonText(application: LoanApplicationSummary): string {
    if (application.status !== 'DRAFT') {
      return 'View Details';
    }

    // For draft applications, show what step is next
    if (!application.hasPersonalDetails) {
      return 'Complete Profile';
    }

    if (!application.hasFinancialProfile) {
      return 'Complete Employment';
    }

    if (!application.documentsCount || application.documentsCount === 0) {
      return 'Upload Documents';
    }

    return 'Submit Application';
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
    return ['DRAFT', 'PENDING_DOCUMENTS', 'DOCUMENT_INCOMPLETE', 'APPROVED'].includes(application.status);
  }

  /**
   * Check if application needs document resubmission
   */
  needsResubmission(application: LoanApplicationSummary): boolean {
    return application.status === 'DOCUMENT_INCOMPLETE';
  }

  /**
   * Navigate to document resubmission page
   */
  resubmitDocuments(event: Event, applicationId: string): void {
    event.stopPropagation(); // Prevent row click
    
    // Check if this is a compliance request or loan officer request
    const application = this.recentApplications().find(app => app.id === applicationId);
    if (application?.status === 'PENDING_COMPLIANCE_DOCS') {
      // Route to compliance document resubmission
      this.router.navigate(['/applicant/compliance-document-resubmission', applicationId]);
    } else {
      // Route to regular loan officer document resubmission
      this.router.navigate(['/applicant/document-resubmission', applicationId]);
    }
  }

  /**
   * Get count of pending tasks
   */
  getPendingTasksCount(): number {
    return this.getPendingTasks().length;
  }

  /**
   * Get all pending tasks - shows what actions are needed for DRAFT applications
   */
  getPendingTasks(): any[] {
    const tasks: any[] = [];
    
    // Profile completion task
    if (!this.canApplyForLoan()) {
      tasks.push({
        id: 'profile-completion',
        title: 'Complete Profile Setup',
        description: 'Fill in your personal and financial details to start applying for loans',
        priority: 'HIGH',
        type: 'PROFILE',
        actionUrl: '/applicant/personal-details',
        actionText: 'Complete Profile'
      });
    }
    
    // Tasks for DRAFT applications based on what's missing
    this.recentApplications()
      .filter(app => app.status === 'DRAFT')
      .forEach((application) => {
        const loanTypeDisplay = this.getLoanTypeDisplay(application.loanType);
        
        // Check what's missing and create appropriate task
        if (!application.hasPersonalDetails) {
          tasks.push({
            id: `personal-${application.id}`,
            title: 'Complete Personal Details',
            description: `Complete your personal information for ${loanTypeDisplay} application`,
            priority: 'HIGH',
            type: 'PERSONAL_DETAILS',
            actionMethod: 'viewApplication',
            actionText: 'Complete Now',
            applicationId: application.id
          });
        } else if (!application.hasFinancialProfile) {
          tasks.push({
            id: `employment-${application.id}`,
            title: 'Complete Employment & Financial Details',
            description: `Add employment and income information for ${loanTypeDisplay} (${this.formatCurrency(application.requestedAmount)})`,
            priority: 'HIGH',
            type: 'EMPLOYMENT',
            actionMethod: 'viewApplication',
            actionText: 'Continue Application',
            applicationId: application.id
          });
        } else if (!application.documentsCount || application.documentsCount === 0) {
          tasks.push({
            id: `documents-${application.id}`,
            title: 'Upload Required Documents',
            description: `Upload supporting documents for ${loanTypeDisplay} application`,
            priority: 'MEDIUM',
            type: 'DOCUMENTS',
            actionMethod: 'viewApplication',
            actionText: 'Upload Documents',
            applicationId: application.id
          });
        } else {
          // All steps complete, ready for final submission
          tasks.push({
            id: `submit-${application.id}`,
            title: 'Submit Application for Review',
            description: `Your ${loanTypeDisplay} application is ready. Review and submit for approval.`,
            priority: 'HIGH',
            type: 'SUBMIT',
            actionMethod: 'viewApplication',
            actionText: 'Review & Submit',
            applicationId: application.id
          });
        }
      });
    
    // Tasks for applications needing additional documents
    this.recentApplications()
      .filter(app => app.status === 'PENDING_DOCUMENTS' || app.status === 'PENDING_COMPLIANCE_DOCS')
      .forEach((application) => {
        tasks.push({
          id: `additional-docs-${application.id}`,
          title: application.status === 'PENDING_COMPLIANCE_DOCS' ? 'Compliance Requested Documents' : 'Additional Documents Required',
          description: application.status === 'PENDING_COMPLIANCE_DOCS'
            ? `Compliance officer has requested additional documents for your ${this.getLoanTypeDisplay(application.loanType)} application`
            : `Loan officer has requested additional documents for your ${this.getLoanTypeDisplay(application.loanType)} application`,
          priority: 'URGENT',
          type: 'ADDITIONAL_DOCUMENTS',
          actionMethod: 'viewApplication',
          actionText: 'Upload Now',
          applicationId: application.id
        });
      });
    
    return tasks;
  }

  /**
   * Execute task action
   */
  executeTaskAction(task: any): void {
    if (task.actionMethod === 'viewApplication') {
      this.viewApplication(task.applicationId);
    }
    // Add other action methods as needed
  }

  /**
   * Get task background class based on priority
   */
  getTaskBackgroundClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'bg-red-50 border-red-200';
      case 'medium':
        return 'bg-blue-50 border-blue-200';
      case 'low':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-orange-50 border-orange-200';
    }
  }

  /**
   * Get task icon color based on priority
   */
  getTaskIconColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'text-red-400';
      case 'medium':
        return 'text-blue-400';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-orange-400';
    }
  }

  /**
   * Get task border color based on priority
   */
  getTaskBorderColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'border-red-400';
      case 'medium':
        return 'border-blue-400';
      case 'low':
        return 'border-gray-400';
      default:
        return 'border-orange-400';
    }
  }

  /**
   * Get task action color based on priority
   */
  getTaskActionColor(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
      case 'high':
        return 'text-red-700 hover:text-red-800';
      case 'medium':
        return 'text-blue-700 hover:text-blue-800';
      case 'low':
        return 'text-gray-700 hover:text-gray-800';
      default:
        return 'text-orange-700 hover:text-orange-800';
    }
  }

  /**
   * Get task badge class based on priority
   */
  getTaskBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  }

  /**
   * Get task priority display text
   */
  getTaskPriorityDisplay(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return 'Normal';
    }
  }

  /**
   * Get time of day greeting
   */
  getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Morning';
    } else if (hour < 17) {
      return 'Afternoon';
    } else {
      return 'Evening';
    }
  }

  /**
   * Get performance chart data for bar chart
   */
  getPerformanceChartData(): Array<{ label: string; value: number; color: string; percentage: number }> {
    const stats = this.dashboardStats();
    const maxVal = Math.max(
      stats.totalApplications || 0,
      stats.activeApplications || 0,
      stats.approvedApplications || 0,
      stats.rejectedApplications || 0
    );

    return [
      { 
        label: 'Total Applications', 
        value: stats.totalApplications || 0, 
        color: '#3b82f6', 
        percentage: maxVal > 0 ? ((stats.totalApplications || 0) / maxVal) * 100 : 0 
      },
      { 
        label: 'Active', 
        value: stats.activeApplications || 0, 
        color: '#f59e0b', 
        percentage: maxVal > 0 ? ((stats.activeApplications || 0) / maxVal) * 100 : 0 
      },
      { 
        label: 'Approved', 
        value: stats.approvedApplications || 0, 
        color: '#10b981', 
        percentage: maxVal > 0 ? ((stats.approvedApplications || 0) / maxVal) * 100 : 0 
      },
      { 
        label: 'Rejected', 
        value: stats.rejectedApplications || 0, 
        color: '#ef4444', 
        percentage: maxVal > 0 ? ((stats.rejectedApplications || 0) / maxVal) * 100 : 0 
      }
    ].filter(item => item.value > 0);
  }

  /**
   * Check if profile is incomplete (for fresh customers only)
   * Only show when profile is loaded AND incomplete
   */
  isProfileIncomplete(): boolean {
    // Don't show during loading
    if (!this.profileLoaded()) {
      return false;
    }
    
    const completionPercentage = this.profileCompletionPercentage();
    
    // Only show alert if profile completion is less than 80% (indicating incomplete profile)
    // This ensures only fresh/new customers see the alert, not existing customers with complete profiles
    return completionPercentage < 80;
  }

  /**
   * Get active loans count
   */
  getActiveLoansCount(): number {
    return this.activeLoans().length;
  }

  /**
   * Calculate paid amount for a loan (placeholder - would need EMI payment data from backend)
   * For now, returns 0 as we don't have payment history
   */
  getPaidAmount(loan: LoanApplicationSummary): number {
    // TODO: This would need EMI payment history from backend
    // For now, return 0 since we don't have this data
    return 0;
  }

  /**
   * Calculate pending amount for a loan
   */
  getPendingAmount(loan: LoanApplicationSummary): number {
    const paid = this.getPaidAmount(loan);
    // Use approvedAmount if available, otherwise use requestedAmount
    const totalAmount = loan.approvedAmount || loan.requestedAmount || 0;
    return Math.max(0, totalAmount - paid);
  }

  /**
   * Get approved amount for a loan
   */
  getApprovedAmount(loan: LoanApplicationSummary): number {
    // Use approvedAmount if available, otherwise use requestedAmount
    return loan.approvedAmount || loan.requestedAmount || 0;
  }

  /**
   * Get interest rate for a loan
   */
  getInterestRate(loan: LoanApplicationSummary): number {
    // Return approvedInterestRate if available
    return loan.approvedInterestRate || 0;
  }
}
