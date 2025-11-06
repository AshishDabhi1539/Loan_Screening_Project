import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { LoanApplicationResponse } from '../../../../core/models/loan-application.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { LoanApplicationSummary } from '../../../../core/models/dashboard.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './my-applications.component.html',
  styleUrl: './my-applications.component.css'
})
export class MyApplicationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly loanApplicationService = inject(LoanApplicationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationService = inject(NotificationService);

  isLoading = signal(false);
  applications = signal<LoanApplicationSummary[]>([]);
  
  // Filters
  filterStatus = signal<string>('ALL');

  // Pagination signals
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [5, 10, 25, 50, 100];

  filteredApplications = computed(() => {
    let filtered = this.applications();
    
    // Status filter
    const status = this.filterStatus();
    if (status !== 'ALL') {
      filtered = filtered.filter(a => a.status === status);
    }
    
    // Search filter
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      filtered = filtered.filter(a => 
        a.loanType?.toLowerCase().includes(query) ||
        a.status?.toLowerCase().includes(query) ||
        a.id?.toLowerCase().includes(query)
      );
    }
    
    // Sort by last updated (newest first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.lastUpdated).getTime();
      const dateB = new Date(b.lastUpdated).getTime();
      return dateB - dateA;
    });
  });
  
  // Paginated applications
  paginatedApplications = computed(() => {
    const filtered = this.filteredApplications();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });
  
  // Pagination info
  totalPages = computed(() => Math.ceil(this.filteredApplications().length / this.itemsPerPage()));
  totalItems = computed(() => this.filteredApplications().length);
  showingFrom = computed(() => {
    const filtered = this.filteredApplications();
    return filtered.length === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });
  showingTo = computed(() => {
    const filtered = this.filteredApplications();
    const end = this.currentPage() * this.itemsPerPage();
    return Math.min(end, filtered.length);
  });
  
  // Status counts for filter badges
  statusCounts = computed(() => {
    const apps = this.applications();
    return {
      all: apps.length,
      draft: apps.filter(a => a.status === 'DRAFT').length,
      submitted: apps.filter(a => a.status === 'SUBMITTED').length,
      underReview: apps.filter(a => ['UNDER_REVIEW', 'DOCUMENT_VERIFICATION', 'EXTERNAL_VERIFICATION', 'COMPLIANCE_REVIEW'].includes(a.status)).length,
      approved: apps.filter(a => a.status === 'APPROVED').length,
      rejected: apps.filter(a => a.status === 'REJECTED').length
    };
  });

  // Computed: Paginated applications
  paginatedApplications = computed(() => {
    const filtered = this.filteredApplications();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

  // Computed: Pagination info
  totalPages = computed(() => Math.ceil(this.filteredApplications().length / this.itemsPerPage()));
  totalItems = computed(() => this.filteredApplications().length);
  showingFrom = computed(() => {
    const filtered = this.filteredApplications();
    return filtered.length === 0 ? 0 : (this.currentPage() - 1) * this.itemsPerPage() + 1;
  });
  showingTo = computed(() => {
    const filtered = this.filteredApplications();
    const to = this.currentPage() * this.itemsPerPage();
    return to > filtered.length ? filtered.length : to;
  });
  canGoPrevious = computed(() => this.currentPage() > 1);
  canGoNext = computed(() => this.currentPage() < this.totalPages());

  constructor() {
    // Reset to first page when filter changes
    effect(() => {
      this.filterStatus();
      if (this.applications().length > 0) {
        this.currentPage.set(1);
      }
    });
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.loanApplicationService.getMyApplications().subscribe({
      next: (apps: LoanApplicationResponse[]) => {
        // Reuse dashboard transformation for consistency
        const summaries = (apps || []).map(app => ({
          id: app.id,
          loanType: app.loanType,
          requestedAmount: Number(app.requestedAmount) || 0,
          status: app.status,
          submittedDate: new Date(app.submittedAt || app.createdAt || Date.now()),
          lastUpdated: new Date(app.updatedAt || Date.now()),
          nextAction: undefined,
          progress: 0,
          applicantName: app.applicantName,
          assignedOfficerName: undefined,
          hasPersonalDetails: undefined,
          hasFinancialProfile: undefined,
          documentsCount: undefined,
          employmentType: undefined
        })) as LoanApplicationSummary[];

        // Enrich with progress and nextAction via DashboardService helpers
        const enriched = summaries.map(s => ({
          ...s,
          progress: (this as any).dashboardService['calculateProgress']
            ? (this as any).dashboardService['calculateProgress'](s.status)
            : s.progress,
          nextAction: (this as any).dashboardService['getNextAction']
            ? (this as any).dashboardService['getNextAction'](s.status)
            : s.nextAction
        }));

        this.applications.set(enriched);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
        this.notificationService.error('Error', 'Unable to load applications');
        this.isLoading.set(false);
      }
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status);
  }

  /**
   * Change items per page
   */
  onItemsPerPageChange(value: number): void {
    this.itemsPerPage.set(value);
    this.currentPage.set(1);
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.canGoPrevious()) {
      this.currentPage.update(page => page - 1);
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update(page => page + 1);
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getStatusDisplay(status: string): string {
    return this.dashboardService.getStatusDisplay(status);
  }

  getStatusBadgeColor(status: string): string {
    return this.dashboardService.getStatusBadgeColor(status);
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return this.dashboardService.formatDate(date);
  }
  
  getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return this.formatDate(date);
  }
  
  formatLoanType(loanType: string): string {
    return loanType?.replace(/_/g, ' ') || 'N/A';
  }
  
  formatStatus(status: string): string {
    return this.getStatusDisplay(status);
  }

  viewApplication(applicationId: string): void {
    // Always navigate to application-details page
    this.router.navigate(['/applicant/application-details', applicationId]);
  }

  /**
   * Resume incomplete application - navigate to the step where user left off
   * Application flow: Apply for Loan -> Employment Details -> Document Upload -> Submit
   */
  resumeApplication(applicationId: string): void {
    const app = this.applications().find(a => a.id === applicationId);
    
    if (!app) {
      this.notificationService.error('Error', 'Application not found');
      return;
    }

    // Only resume if status is DRAFT
    if (app.status !== 'DRAFT') {
      return;
    }

    // Check if employment details are filled (hasFinancialProfile = true means employment details are complete)
    const employmentDetailsFilled = app.hasFinancialProfile === true;

    if (!employmentDetailsFilled) {
      // Step 1: Employment & Financial Details not filled -> go to employment-details
      this.notificationService.info('Continue Application', 'Please complete employment and financial details');
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: { applicationId: app.id }
      });
      return;
    }

    // Step 2: Employment details are filled -> go directly to document upload
    // Check if documents are uploaded
    const documentsUploaded = app.documentsCount && app.documentsCount > 0;

    if (!documentsUploaded) {
      this.notificationService.info('Upload Documents', 'Please upload required documents');
      this.router.navigate(['/applicant/document-upload'], {
        queryParams: {
          applicationId: app.id,
          employmentType: app.employmentType || 'SALARIED'
        }
      });
      return;
    }

    // Step 3: All application steps complete but still DRAFT -> show summary for final submission
    this.notificationService.info('Application Ready', 'Your application is ready for submission');
    this.router.navigate(['/applicant/application-details', app.id]);
  }
}


