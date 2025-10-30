import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { LoanOfficerService, OfficerDashboardResponse, LoanApplicationSummary } from '../../../../core/services/loan-officer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-loan-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private router = inject(Router);
  private loanOfficerService = inject(LoanOfficerService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Signals for reactive state
  currentUser = this.authService.currentUser;
  isLoading = signal(false);
  dashboardData = signal<OfficerDashboardResponse | null>(null);
  
  // Computed values
  userDisplayName = computed(() => {
    const user = this.currentUser();
    return user?.displayName || user?.email?.split('@')[0] || 'Officer';
  });

  statistics = computed(() => {
    const data = this.dashboardData();
    if (!data) return null;
    
    return {
      totalAssigned: data.totalAssigned,
      pendingReview: data.pendingReview,
      underVerification: data.underVerification,
      readyForDecision: data.readyForDecision,
      completedToday: data.completedToday,
      avgProcessingTime: data.avgProcessingTime
    };
  });

  priorityBreakdown = computed(() => {
    const data = this.dashboardData();
    return data?.priorityBreakdown || { high: 0, medium: 0, low: 0 };
  });

  recentApplications = computed(() => {
    const data = this.dashboardData();
    return data?.recentApplications || [];
  });

  recentActivities = computed(() => {
    const data = this.dashboardData();
    return data?.recentActivities || [];
  });

  hasHighPriorityApplications = computed(() => {
    const breakdown = this.priorityBreakdown();
    return breakdown.high > 0;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    
    this.loanOfficerService.getDashboard().subscribe({
      next: (response) => {
        this.dashboardData.set(response);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data');
        this.isLoading.set(false);
      }
    });
  }

  refreshDashboard(): void {
    this.notificationService.info('Refresh', 'Refreshing dashboard...');
    this.loadDashboard();
  }

  viewApplication(applicationId: string): void {
    this.router.navigate(['/loan-officer/applications', applicationId, 'details']);
  }

  startReview(applicationId: string): void {
    this.router.navigate(['/loan-officer/applications', applicationId, 'details']);
  }

  viewAllApplications(): void {
    this.router.navigate(['/loan-officer/applications']);
  }

  viewReadyForDecision(): void {
    this.router.navigate(['/loan-officer/applications'], {
      queryParams: { filter: 'ready-for-decision' }
    });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  getStatusBadgeClass(status: string): string {
    return this.loanOfficerService.getStatusBadgeClass(status);
  }

  getPriorityBadgeClass(priority: string): string {
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  getPriorityIcon(priority: string): string {
    const icons: { [key: string]: string } = {
      'HIGH': '🔴',
      'MEDIUM': '🟡',
      'LOW': '🟢'
    };
    return icons[priority] || '⚪';
  }

  getTimeAgo(date: Date | string): string {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  getLoanTypeIcon(loanType: string): string {
    const icons: { [key: string]: string } = {
      'PERSONAL_LOAN': '👤',
      'HOME_LOAN': '🏠',
      'CAR_LOAN': '🚗',
      'TWO_WHEELER_LOAN': '🏍️',
      'EDUCATION_LOAN': '🎓',
      'BUSINESS_LOAN': '💼',
      'GOLD_LOAN': '💰',
      'PROPERTY_LOAN': '🏢'
    };
    return icons[loanType] || '📄';
  }

  formatLoanType(loanType: string): string {
    return loanType.replace(/_/g, ' ');
  }

  getProgressPercentage(): number {
    const stats = this.statistics();
    if (!stats || stats.totalAssigned === 0) return 0;
    
    const completed = stats.completedToday;
    const total = stats.totalAssigned;
    return Math.round((completed / total) * 100);
  }

  getWorkloadStatus(): { label: string; color: string } {
    const stats = this.statistics();
    if (!stats) return { label: 'No Data', color: 'gray' };

    const pending = stats.pendingReview + stats.underVerification;
    
    if (pending === 0) return { label: 'All Caught Up! 🎉', color: 'green' };
    if (pending <= 5) return { label: 'Light Workload', color: 'green' };
    if (pending <= 10) return { label: 'Moderate Workload', color: 'yellow' };
    return { label: 'Heavy Workload', color: 'red' };
  }
}
