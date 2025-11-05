import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
  searchQuery = signal<string>('');
  
  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [5, 10, 25, 50];

  // Smart filtered applications with search
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
    this.currentPage.set(1); // Reset to first page
  }
  
  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1); // Reset to first page
  }
  
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
  
  onItemsPerPageChange(size: number): void {
    this.itemsPerPage.set(size);
    this.currentPage.set(1); // Reset to first page
  }
  
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total);
      } else if (current >= total - 3) {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(total);
      }
    }
    
    return pages;
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
    const app = this.applications().find(a => a.id === applicationId);
    if (!app) {
      this.notificationService.error('Error', 'Application not found');
      return;
    }

    // Draft vs submitted handling similar to dashboard
    if (app.status !== 'DRAFT') {
      this.router.navigate(['/applicant/application-details', app.id]);
      return;
    }

    // For draft, navigate to personal or employment based on what we know
    if (!app.hasPersonalDetails) {
      this.router.navigate(['/applicant/personal-details']);
      return;
    }
    if (!app.hasFinancialProfile) {
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: { applicationId: app.id }
      });
      return;
    }

    this.router.navigate(['/applicant/document-upload'], {
      queryParams: { applicationId: app.id }
    });
  }
}


