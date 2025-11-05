import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService } from '../../../../core/services/loan-officer.service';
import { OfficerDashboardResponse, LoanApplicationResponse } from '../../../../core/models/officer.model';

@Component({
  selector: 'app-loan-officer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  assignedApplications = signal<LoanApplicationResponse[]>([]);

  // Computed values
  userDisplayName = computed(() => {
    const officerName = this.dashboardData()?.officerName;
    if (officerName) {
      // Extract first and last name only
      const parts = officerName.trim().split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0];
      if (parts.length >= 2) return `${parts[0]} ${parts[parts.length - 1]}`;
    }
    const user = this.currentUser();
    return user?.email?.split('@')[0] || 'Officer';
  });

  // Pagination signals for dashboard table
  currentPage = signal(1);
  itemsPerPage = signal(5);
  itemsPerPageOptions = [5, 10, 25, 50];

  // Top applications for table - sorted by most recent changes
  topApplications = computed(() => {
    const apps = [...this.assignedApplications()];
    // Sort by assignedAt (most recent first), then by submittedAt if assignedAt is not available
    apps.sort((a, b) => {
      const dateA = a.assignedAt ? new Date(a.assignedAt).getTime() : new Date(a.submittedAt).getTime();
      const dateB = b.assignedAt ? new Date(b.assignedAt).getTime() : new Date(b.submittedAt).getTime();
      return dateB - dateA; // Descending order (most recent first)
    });
    return apps;
  });

  // Paginated applications for dashboard table
  paginatedApplications = computed(() => {
    const filtered = this.topApplications();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

  // Pagination info
  totalPages = computed(() => Math.ceil(this.topApplications().length / this.itemsPerPage()));
  totalItems = computed(() => this.topApplications().length);
  showingFrom = computed(() => {
    const filtered = this.topApplications();
    return filtered.length === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });
  showingTo = computed(() => {
    const filtered = this.topApplications();
    const to = this.currentPage() * this.itemsPerPage();
    return to > filtered.length ? filtered.length : to;
  });
  canGoPrevious = computed(() => this.currentPage() > 1);
  canGoNext = computed(() => this.currentPage() < this.totalPages());

  // Performance metrics for bar chart
  performanceChartData = computed(() => {
    const data = this.dashboardData();
    if (!data) return [];
    
    return [
      { label: 'Completed Today', value: data.completedToday || 0, color: '#10b981' },
      { label: 'In Progress', value: data.inProgress || 0, color: '#f59e0b' },
      { label: 'Verified', value: data.verified || 0, color: '#3b82f6' },
      { label: 'Rejected', value: data.rejected || 0, color: '#ef4444' }
    ];
  });

  // Get max value for chart scaling
  maxChartValue = computed(() => {
    const values = this.performanceChartData().map(item => item.value);
    return Math.max(...values, 1); // At least 1 to avoid division by zero
  });

  // Todo list - pending tasks
  todoList = computed(() => {
    const apps = this.assignedApplications();
    const todos: Array<{id: string, task: string, priority: string, status: string, applicantName: string}> = [];
    
    apps.forEach(app => {
      if (app.status === 'UNDER_REVIEW') {
        todos.push({
          id: app.id,
          task: `Start document verification for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'DOCUMENT_INCOMPLETE') {
        todos.push({
          id: app.id,
          task: `Review resubmitted documents for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'DOCUMENT_VERIFICATION') {
        todos.push({
          id: app.id,
          task: `Complete document verification for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'PENDING_EXTERNAL_VERIFICATION') {
        todos.push({
          id: app.id,
          task: `Trigger external verification for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'EXTERNAL_VERIFICATION' || app.status === 'FRAUD_CHECK') {
        todos.push({
          id: app.id,
          task: `Review external verification results for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'MEDIUM',
          status: app.status,
          applicantName: app.applicantName
        });
      } else if (app.status === 'READY_FOR_DECISION') {
        todos.push({
          id: app.id,
          task: `Make final decision for ${this.formatFirstLast(app.applicantName)}`,
          priority: app.priority || 'HIGH',
          status: app.status,
          applicantName: app.applicantName
        });
      }
    });
    
    // Sort by priority: CRITICAL > HIGH > MEDIUM > LOW
    const priorityOrder: {[key: string]: number} = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3, 'URGENT': 0 };
    return todos.sort((a, b) => (priorityOrder[a.priority] || 99) - (priorityOrder[b.priority] || 99));
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Load dashboard data from backend
   */
  private loadDashboard(): void {
    this.isLoading.set(true);
    let dashboardLoaded = false;
    let applicationsLoaded = false;
    
    const checkComplete = () => {
      if (dashboardLoaded && applicationsLoaded) {
        this.isLoading.set(false);
      }
    };
    
    // Load dashboard stats
    this.loanOfficerService.getDashboard().subscribe({
      next: (data) => {
        this.dashboardData.set(data);
        dashboardLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.notificationService.error(
          'Error Loading Dashboard',
          'Failed to load dashboard data. Please try again.'
        );
        dashboardLoaded = true;
        checkComplete();
      }
    });

    // Load assigned applications
    this.loanOfficerService.getAssignedApplications().subscribe({
      next: (apps) => {
        this.assignedApplications.set(apps);
        applicationsLoaded = true;
        checkComplete();
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        applicationsLoaded = true;
        checkComplete();
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
    const app = this.assignedApplications().find(a => a.id === applicationId) || 
                this.dashboardData()?.recentApplications?.find(a => a.id === applicationId);
    
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
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format loan type
   */
  formatLoanType(loanType: string | null | undefined): string {
    if (!loanType) return 'N/A';
    return loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get status badge color (for compliance-style badges)
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'UNDER_REVIEW': 'bg-blue-100 text-blue-800',
      'DOCUMENT_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'DOCUMENT_INCOMPLETE': 'bg-orange-100 text-orange-800',
      'PENDING_EXTERNAL_VERIFICATION': 'bg-purple-100 text-purple-800',
      'EXTERNAL_VERIFICATION': 'bg-indigo-100 text-indigo-800',
      'FRAUD_CHECK': 'bg-red-100 text-red-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'URGENT': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Show only first and last name from a full name string
   */
  formatFirstLast(name?: string | null): string {
    if (!name) return 'N/A';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'N/A';
    if (parts.length === 1) return parts[0];
    return `${parts[0]} ${parts[parts.length - 1]}`;
  }

  /**
   * Get bar height percentage for chart
   */
  getBarHeight(value: number): number {
    const max = this.maxChartValue();
    return max > 0 ? (value / max) * 100 : 0;
  }

  /**
   * Set items per page
   */
  setItemsPerPage(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  /**
   * Go to previous page
   */
  goPrevPage(): void {
    if (this.canGoPrevious()) {
      this.currentPage.update(p => Math.max(1, p - 1));
    }
  }

  /**
   * Go to next page
   */
  goNextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
    }
  }
}
