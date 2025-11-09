import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanOfficerService } from '../../../../core/services/loan-officer.service';
import { LoanApplicationResponse } from '../../../../core/models/officer.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-post-compliance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './post-compliance-list.component.html',
  styleUrls: ['./post-compliance-list.component.css']
})
export class PostComplianceListComponent implements OnInit {
  applications = signal<LoanApplicationResponse[]>([]);
  filteredApplications = signal<LoanApplicationResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  riskLevelFilter = signal<string>('all');
  
  // Sorting
  sortBy = signal<string>('submittedAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [5, 10, 25, 50, 100];

  // Bulk actions
  selectedApplications = signal<Set<string>>(new Set());
  isSelectAllChecked = signal(false);
  showBulkActions = signal(false);

  // Math utility for template
  Math = Math;

  // Computed signals for filtering
  flaggedApplications = computed(() => 
    this.applications().filter(app => app.status === 'FLAGGED_FOR_COMPLIANCE')
  );

  underInvestigationApplications = computed(() => 
    this.applications().filter(app => app.status === 'UNDER_INVESTIGATION')
  );

  awaitingDecisionApplications = computed(() => 
    this.applications().filter(app => app.status === 'AWAITING_COMPLIANCE_DECISION')
  );

  readyForReviewApplications = computed(() => 
    this.applications().filter(app => 
      app.status === 'READY_FOR_DECISION' && 
      app.fromCompliance === true &&
      app.complianceReviewAcknowledged === false
    )
  );

  readyForDecisionApplications = computed(() => 
    this.applications().filter(app => 
      app.status === 'READY_FOR_DECISION' && 
      app.fromCompliance === true &&
      app.complianceReviewAcknowledged === true
    )
  );

  totalCount = computed(() => this.applications().length);

  constructor(
    private loanOfficerService: LoanOfficerService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.loanOfficerService.getPostComplianceApplications().subscribe({
      next: (apps) => {
        console.log(`Received ${apps.length} post-compliance applications:`, apps);
        this.applications.set(apps);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading post-compliance applications:', err);
        this.error.set('Failed to load applications. Please try again.');
        this.notificationService.error(
          'Error Loading Applications',
          'Failed to load post-compliance applications. Please try again.'
        );
        this.loading.set(false);
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

    // Risk level filter
    if (this.riskLevelFilter() !== 'all') {
      filtered = filtered.filter(app => app.riskLevel === this.riskLevelFilter());
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
      case 'priority':
        return app.priority;
      case 'riskLevel':
        return app.riskLevel;
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
   * Navigate to application details page (same as Assigned Applications)
   */
  viewApplication(applicationId: string): void {
    this.router.navigate(['/loan-officer/application', applicationId, 'details'], {
      queryParams: { returnUrl: '/loan-officer/applications/post-compliance' }
    });
  }

  getStatusBadge(application: LoanApplicationResponse): { text: string; class: string; icon: string } {
    if (application.status === 'FLAGGED_FOR_COMPLIANCE') {
      return {
        text: 'Flagged for Compliance',
        class: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '🔍'
      };
    }
    if (application.status === 'UNDER_INVESTIGATION') {
      return {
        text: 'Under Investigation',
        class: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔬'
      };
    }
    if (application.status === 'AWAITING_COMPLIANCE_DECISION') {
      return {
        text: 'Awaiting Compliance Decision',
        class: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: '⏳'
      };
    }
    if (application.status === 'READY_FOR_DECISION' && application.fromCompliance) {
      if (!application.complianceReviewAcknowledged) {
        return {
          text: 'Reviewed by Compliance',
          class: 'bg-green-100 text-green-800 border-green-300',
          icon: '✅'
        };
      } else {
        return {
          text: 'Ready for Your Decision',
          class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: '🎯'
        };
      }
    }
    return {
      text: application.status,
      class: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '📋'
    };
  }

  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  getPriorityClass(priority: string): string {
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  getRiskLevelClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }

  /**
   * Get paginated applications
   */
  paginatedApplications = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return this.filteredApplications().slice(start, end);
  });

  /**
   * Get total pages
   */
  totalPages = computed(() => {
    return Math.ceil(this.filteredApplications().length / this.itemsPerPage());
  });

  /**
   * Pagination info
   */
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

  /**
   * Change page
   */
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
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
  previousPage(): void {
    if (this.canGoPrevious()) {
      this.currentPage.update(p => Math.max(1, p - 1));
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.canGoNext()) {
      this.currentPage.update(p => Math.min(this.totalPages(), p + 1));
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
   * Get unique statuses for filter
   */
  uniqueStatuses = computed(() => {
    const statuses = new Set(this.applications().map(app => app.status));
    return Array.from(statuses).sort();
  });

  /**
   * Get unique priorities for filter
   */
  uniquePriorities = computed(() => {
    const priorities = new Set(this.applications().map(app => app.priority));
    return Array.from(priorities).sort();
  });

  /**
   * Get unique risk levels for filter
   */
  uniqueRiskLevels = computed(() => {
    const levels = new Set(this.applications().map(app => app.riskLevel));
    return Array.from(levels).sort();
  });

  /**
   * Toggle select all applications
   */
  toggleSelectAll(): void {
    const currentlyChecked = this.isSelectAllChecked();
    this.isSelectAllChecked.set(!currentlyChecked);
    
    if (!currentlyChecked) {
      // Select all visible applications
      const allIds = new Set(this.paginatedApplications().map(app => app.id));
      this.selectedApplications.set(allIds);
    } else {
      // Deselect all
      this.selectedApplications.set(new Set());
    }
    
    this.updateBulkActionsVisibility();
  }

  /**
   * Toggle individual application selection
   */
  toggleApplicationSelection(applicationId: string): void {
    const selected = this.selectedApplications();
    const newSelected = new Set(selected);
    
    if (newSelected.has(applicationId)) {
      newSelected.delete(applicationId);
    } else {
      newSelected.add(applicationId);
    }
    
    this.selectedApplications.set(newSelected);
    this.isSelectAllChecked.set(newSelected.size === this.paginatedApplications().length);
    this.updateBulkActionsVisibility();
  }

  /**
   * Check if application is selected
   */
  isApplicationSelected(applicationId: string): boolean {
    return this.selectedApplications().has(applicationId);
  }

  /**
   * Update bulk actions visibility
   */
  private updateBulkActionsVisibility(): void {
    this.showBulkActions.set(this.selectedApplications().size > 0);
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    this.selectedApplications.set(new Set());
    this.isSelectAllChecked.set(false);
    this.showBulkActions.set(false);
  }
}
