import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplianceService } from '../../../../core/services/compliance.service';
import { LoanApplicationResponse } from '../../../../core/models/compliance.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications-list.component.html',
  styleUrl: './applications-list.component.css'
})
export class ApplicationsListComponent implements OnInit {
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private idEncoder = inject(IdEncoderService);

  // State signals
  applications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(true);

  // Filter signals
  searchTerm = signal('');
  selectedStatus = signal<string>('ALL');
  selectedPriority = signal<string>('ALL');

  // Pagination signals
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [5, 10, 25, 50, 100];

  // Status and Priority options
  // Note: APPROVED and REJECTED are excluded (history only). READY_FOR_DECISION is included here
  // so it appears in both Assigned and Ready For Decision views.
  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'FLAGGED_FOR_COMPLIANCE', label: 'Flagged' },
    { value: 'COMPLIANCE_REVIEW', label: 'Under Review' },
    { value: 'UNDER_INVESTIGATION', label: 'Under Investigation' },
    { value: 'PENDING_COMPLIANCE_DOCS', label: 'Pending Documents' },
    { value: 'AWAITING_COMPLIANCE_DECISION', label: 'Awaiting Decision' },
    { value: 'READY_FOR_DECISION', label: 'Ready For Decision' }
  ];

  priorityOptions = [
    { value: 'ALL', label: 'All Priorities' },
    { value: 'CRITICAL', label: 'Critical' },
    { value: 'HIGH', label: 'High' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'LOW', label: 'Low' }
  ];

  // Computed: Filtered applications
  filteredApplications = computed(() => {
    let filtered = this.applications();

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(app =>
        app.applicantName?.toLowerCase().includes(search) ||
        app.loanType?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.selectedStatus() !== 'ALL') {
      filtered = filtered.filter(app => app.status === this.selectedStatus());
    }

    // Priority filter
    if (this.selectedPriority() !== 'ALL') {
      filtered = filtered.filter(app => app.priority === this.selectedPriority());
    }

    return filtered;
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
    // Reset to first page when filters change
    effect(() => {
      this.searchTerm();
      this.selectedStatus();
      this.selectedPriority();
      if (this.applications().length > 0) {
        this.currentPage.set(1);
      }
    });
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * Load all assigned applications
   */
  loadApplications(): void {
    this.isLoading.set(true);

    this.complianceService.getAssignedApplications().subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.isLoading.set(false);
        console.log('✅ Applications loaded:', applications);
      },
      error: (error) => {
        console.error('❌ Error loading applications:', error);
        this.notificationService.error('Error', 'Failed to load applications');
        this.isLoading.set(false);
        this.applications.set([]);
      }
    });
  }

  /**
   * Refresh applications list
   */
  refresh(): void {
    this.notificationService.info('Refreshing', 'Reloading applications...');
    this.loadApplications();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('ALL');
    this.selectedPriority.set('ALL');
    this.currentPage.set(1);
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

  /**
   * View application details
   */
  viewApplication(applicationId: string): void {
    // Encode the ID for secure URL and pass as query parameter
    const encodedId = this.idEncoder.encodeId(applicationId);
    this.router.navigate(['/compliance-officer/applications/review'], {
      queryParams: { ref: encodedId }
    });
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING_COMPLIANCE_DOCS': 'bg-orange-100 text-orange-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'APPROVED': 'bg-green-100 text-green-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format currency
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
  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Format loan type for display
   */
  formatLoanType(loanType: string | null | undefined): string {
    if (!loanType) return 'N/A';
    return loanType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
