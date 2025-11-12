import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NotificationService } from '../../../../core/services/notification.service';
import { AdminService } from '../../../../core/services/admin.service';
import { LoanApplicationResponse } from '../../../../core/models/loan-application.model';

@Component({
  selector: 'app-admin-applications-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './applications-list.component.html',
  styleUrl: './applications-list.component.css'
})
export class ApplicationsListComponent implements OnInit {
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private adminService = inject(AdminService);

  isLoading = signal(false);
  applications = signal<LoanApplicationResponse[]>([]);
  filteredApplications = signal<LoanApplicationResponse[]>([]);
  
  // Filters
  searchQuery = signal('');
  statusFilter = signal<string>('all');
  priorityFilter = signal<string>('all');
  loanTypeFilter = signal<string>('all');
  
  // Sorting
  sortBy = signal<string>('createdAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [10, 25, 50, 100];

  // Bulk actions
  selectedApplications = signal<Set<string>>(new Set());
  isSelectAllChecked = signal(false);
  showBulkActions = signal(false);

  // Math utility for template
  Math = Math;

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * Load all applications
   */
  loadApplications(): void {
    this.isLoading.set(true);
    
    this.adminService.getAllApplications().subscribe({
      next: (apps) => {
        console.log(`Received ${apps.length} applications from backend:`, apps);
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
        app.status.toLowerCase().includes(query) ||
        (app.assignedOfficerName && app.assignedOfficerName.toLowerCase().includes(query))
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
      case 'createdAt':
        return new Date(app.createdAt).getTime();
      case 'requestedAmount':
        return app.requestedAmount;
      case 'applicantName':
        return app.applicantName.toLowerCase();
      case 'status':
        return app.status;
      default:
        return app.createdAt;
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
   * Navigate to application details (admin read-only view)
   */
  viewApplication(applicationId: string): void {
    this.router.navigate(['/admin/applications', applicationId]);
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
   * Format date
   */
  formatDate(date: Date | string): string {
    const dateObj = date instanceof Date ? date : new Date(date);
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(dateObj);
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
      case 'PENDING_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'DOCUMENT_VERIFICATION':
      case 'DOCUMENT_REVERIFICATION':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-indigo-100 text-indigo-800';
      case 'COMPLIANCE_REVIEW':
      case 'FLAGGED_FOR_COMPLIANCE':
      case 'UNDER_INVESTIGATION':
      case 'AWAITING_COMPLIANCE_DECISION':
        return 'bg-purple-100 text-purple-800';
      case 'READY_FOR_DECISION':
        return 'bg-orange-100 text-orange-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'DISBURSED':
        return 'bg-emerald-100 text-emerald-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get priority badge class
   */
  getPriorityBadgeClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
   * Toggle select all applications
   */
  toggleSelectAll(): void {
    const currentlyChecked = this.isSelectAllChecked();
    this.isSelectAllChecked.set(!currentlyChecked);
    
    if (!currentlyChecked) {
      const allIds = new Set(this.paginatedApplications().map(app => app.id));
      this.selectedApplications.set(allIds);
    } else {
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

  /**
   * Export selected applications to Excel
   */
  exportSelectedToExcel(): void {
    const selected = Array.from(this.selectedApplications());
    
    if (selected.length === 0) {
      this.notificationService.warning('No Selection', 'Please select applications to export');
      return;
    }
    
    const appsToExport = this.applications().filter(app => selected.includes(app.id));
    this.exportToExcel(appsToExport, 'selected');
  }

  /**
   * Export all filtered applications to Excel
   */
  exportAllToExcel(): void {
    if (this.filteredApplications().length === 0) {
      this.notificationService.warning('No Data', 'No applications to export');
      return;
    }
    
    this.exportToExcel(this.filteredApplications(), 'all');
  }

  /**
   * Export applications to Excel (CSV format)
   */
  private exportToExcel(applications: LoanApplicationResponse[], exportType: 'all' | 'selected' = 'all'): void {
    if (applications.length === 0) {
      this.notificationService.warning('No Data', 'No applications to export');
      return;
    }

    // Prepare CSV data
    const headers = [
      'Application ID',
      'Applicant Name',
      'Email',
      'Phone',
      'Loan Type',
      'Requested Amount',
      'Tenure (Months)',
      'Status',
      'Priority',
      'Assigned Officer',
      'Submitted Date',
      'Created Date'
    ];

    const rows = applications.map(app => [
      app.id ? app.id.substring(0, 8) + '...' : 'N/A',
      app.applicantName || 'N/A',
      app.applicantEmail || 'N/A',
      app.applicantPhone || 'N/A',
      app.loanType || 'N/A',
      app.requestedAmount ? app.requestedAmount.toString() : '0',
      app.tenureMonths ? app.tenureMonths.toString() : '0',
      app.status || 'N/A',
      app.priority || 'N/A',
      app.assignedOfficerName || 'Unassigned',
      app.submittedAt ? this.formatDate(app.submittedAt) : 'N/A',
      app.createdAt ? this.formatDate(app.createdAt) : 'N/A'
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const exportTypeLabel = exportType === 'selected' ? 'selected' : 'filtered';
    const filename = `admin_applications_${exportTypeLabel}_${timestamp}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.notificationService.success(
      'Export Successful',
      `Exported ${applications.length} ${exportType === 'selected' ? 'selected' : 'filtered'} application(s) to ${filename}`
    );
    
    if (exportType === 'selected') {
      this.clearSelections();
    }
  }
}
