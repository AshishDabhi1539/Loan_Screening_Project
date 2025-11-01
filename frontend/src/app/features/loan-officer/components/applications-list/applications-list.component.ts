import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, LoanApplicationResponse } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications-list.component.html',
  styleUrl: './applications-list.component.css'
})
export class ApplicationsListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  applications = signal<LoanApplicationResponse[]>([]);
  filteredApplications = signal<LoanApplicationResponse[]>([]);
  
  // Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  loanTypeFilter = signal<string>('all');
  
  // Sorting
  sortBy = signal<string>('submittedAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  // Current filter mode (assigned, pending-documents, ready-for-decision)
  filterMode = signal<string>('assigned');

  // Math utility for template
  Math = Math;

  ngOnInit(): void {
    // Get filter mode from route
    const routePath = this.route.snapshot.url;
    if (routePath.length > 0) {
      this.filterMode.set(routePath[routePath.length - 1].path);
    }

    this.loadApplications();
    this.setupFilters();
  }

  /**
   * Setup filters based on current route
   */
  private setupFilters(): void {
    const mode = this.filterMode();
    if (mode === 'pending-documents') {
      this.statusFilter.set('DOCUMENT_VERIFICATION');
    } else if (mode === 'ready-for-decision') {
      this.statusFilter.set('READY_FOR_DECISION');
    }
  }

  /**
   * Load applications based on current filter mode
   */
  loadApplications(): void {
    this.isLoading.set(true);
    
    const mode = this.filterMode();
    let observable;

    if (mode === 'ready-for-decision') {
      observable = this.loanOfficerService.getApplicationsReadyForDecision();
    } else {
      observable = this.loanOfficerService.getAssignedApplications();
    }

    observable.subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.applyFilters();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.notificationService.error(
          'Error Loading Applications',
          'Failed to load applications. Please try again.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Apply all filters and sorting
   */
  private applyFilters(): void {
    let filtered = [...this.applications()];

    // Search filter
    const query = this.searchQuery().toLowerCase();
    if (query) {
      filtered = filtered.filter(app =>
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantEmail.toLowerCase().includes(query) ||
        app.loanType.toLowerCase().includes(query) ||
        app.status.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(app => app.status === this.statusFilter());
    }

    // Priority filter
    if (this.priorityFilter() !== 'all') {
      filtered = filtered.filter(app => app.priority === this.priorityFilter());
    }

    // Loan type filter
    if (this.loanTypeFilter() !== 'all') {
      filtered = filtered.filter(app => app.loanType === this.loanTypeFilter());
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = this.getSortValue(a);
      const bValue = this.getSortValue(b);
      const multiplier = this.sortOrder() === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return -1 * multiplier;
      if (aValue > bValue) return 1 * multiplier;
      return 0;
    });

    this.filteredApplications.set(filtered);
    this.currentPage.set(1);
  }

  /**
   * Get sort value for an application
   */
  private getSortValue(app: LoanApplicationResponse): any {
    switch (this.sortBy()) {
      case 'submittedAt':
        return new Date(app.submittedAt).getTime();
      case 'requestedAmount':
        return app.requestedAmount;
      case 'applicantName':
        return app.applicantName.toLowerCase();
      case 'status':
        return app.status;
      default:
        return app.submittedAt;
    }
  }

  /**
   * Handle search input
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Handle sort change
   */
  onSortChange(field: string): void {
    if (this.sortBy() === field) {
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(field);
      this.sortOrder.set('desc');
    }
    this.applyFilters();
  }

  /**
   * Navigate to application details
   */
  viewApplication(applicationId: string): void {
    this.router.navigate(['/loan-officer/application', applicationId, 'details']);
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
   * Get risk level badge class
   */
  getRiskLevelBadgeClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }

  /**
   * Get paginated applications
   */
  paginatedApplications = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredApplications().slice(start, end);
  });

  /**
   * Get total pages
   */
  totalPages = computed(() => {
    return Math.ceil(this.filteredApplications().length / this.pageSize());
  });

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1); // Ellipsis
        pages.push(total);
      }
    }

    return pages;
  }

  /**
   * Get unique loan types for filter
   */
  uniqueLoanTypes = computed(() => {
    const types = new Set(this.applications().map(app => app.loanType));
    return Array.from(types).sort();
  });

  /**
   * Get unique statuses for filter
   */
  uniqueStatuses = computed(() => {
    const statuses = new Set(this.applications().map(app => app.status));
    return Array.from(statuses).sort();
  });

  /**
   * Get page title based on filter mode
   */
  pageTitle = computed(() => {
    const mode = this.filterMode();
    switch (mode) {
      case 'pending-documents':
        return 'Pending Document Verification';
      case 'ready-for-decision':
        return 'Applications Ready for Decision';
      default:
        return 'Assigned Applications';
    }
  });
}
