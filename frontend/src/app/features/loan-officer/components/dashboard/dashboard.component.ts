import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, OfficerDashboardResponse, LoanApplicationSummary } from '../../../../core/services/loan-officer.service';
import { NotificationBellComponent } from '../../../../shared/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-loan-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationBellComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  // Signals for reactive state
  currentUser = this.authService.currentUser;
  isLoading = signal(false);
  dashboardData = signal<OfficerDashboardResponse | null>(null);

  // Computed values
  userDisplayName = computed(() => {
    // Use officerName from dashboard response (set by backend)
    const officerName = this.dashboardData()?.officerName;
    if (officerName) {
      return officerName;
    }
    // Fallback to currentUser email
    const user = this.currentUser();
    return user?.email?.split('@')[0] || 'Officer';
  });

  stats = computed(() => this.dashboardData());
  recentApplications = computed(() => this.dashboardData()?.recentApplications || []);
  recentActivities = computed(() => this.dashboardData()?.recentActivities || []);

  priorityBreakdown = computed(() => this.dashboardData()?.priorityBreakdown || {
    high: 0,
    medium: 0,
    low: 0
  });

  hasPendingReview = computed(() => (this.dashboardData()?.inProgress || 0) > 0);
  hasReadyForDecision = computed(() => (this.dashboardData()?.verified || 0) > 0);

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Load dashboard data from backend
   */
  private loadDashboard(): void {
    this.isLoading.set(true);
    this.loanOfficerService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.notificationService.error(
          'Error Loading Dashboard',
          'Failed to load dashboard data. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refresh dashboard data
   */
  refreshDashboard(): void {
    this.loadDashboard();
    this.notificationService.success(
      'Dashboard Refreshed',
      'Latest data has been loaded successfully.'
    );
  }

  /**
   * Get greeting based on time of day
   */
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  /**
   * Navigate to applications list
   */
  navigateToApplications(filter?: string): void {
    if (filter) {
      this.router.navigate(['/loan-officer/applications', filter]);
    } else {
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Navigate to application - smart routing based on status
   */
  viewApplication(applicationId: string): void {
    // Find the application to check its status
    const app = this.dashboardData()?.recentApplications?.find(a => a.id === applicationId);
    
    if (app) {
      // If application is in review workflow, navigate to review page
      const reviewStatuses = [
        'DOCUMENT_VERIFICATION', 
        'DOCUMENT_INCOMPLETE',
        'PENDING_EXTERNAL_VERIFICATION',
        'EXTERNAL_VERIFICATION',
        'FRAUD_CHECK',
        'READY_FOR_DECISION'
      ];
      
      if (reviewStatuses.includes(app.status)) {
        // Navigate to review workflow page
        this.router.navigate(['/loan-officer/application', applicationId, 'review']);
      } else {
        // Navigate to details page for other statuses
        this.router.navigate(['/loan-officer/application', applicationId, 'details']);
      }
    } else {
      // Fallback to details page if app not found
      this.router.navigate(['/loan-officer/application', applicationId, 'details']);
    }
  }

  /**
   * Start verification for an application
   */
  startVerification(applicationId: string): void {
    this.router.navigate(['/loan-officer/application', applicationId, 'document-verification']);
  }

  /**
   * Make decision for an application
   */
  makeDecision(applicationId: string): void {
    this.router.navigate(['/loan-officer/application', applicationId, 'decision']);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    return this.loanOfficerService.getStatusBadgeClass(status);
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  /**
   * Format time ago
   */
  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return this.formatDate(date);
  }
}
