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

  // Bulk actions
  selectedApplications = signal<Set<string>>(new Set());
  isSelectAllChecked = signal(false);
  showBulkActions = signal(false);

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
    } else if (mode === 'completed') {
      // Completed mode shows APPROVED, REJECTED, DISBURSED
      this.statusFilter.set('all'); // Will be filtered in loadApplications
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
        console.log(`[${mode}] Received ${apps.length} applications from backend:`, apps);
        let filteredApps = apps;
        
        // Filter based on mode
        if (mode === 'assigned') {
          // Assigned: Show only active applications (exclude final statuses AND compliance statuses)
          filteredApps = apps.filter(app => 
            app.status !== 'APPROVED' && 
            app.status !== 'REJECTED' && 
            app.status !== 'DISBURSED' &&
            app.status !== 'CANCELLED' &&
            // EXCLUDE all compliance-related statuses
            app.status !== 'FLAGGED_FOR_COMPLIANCE' &&
            app.status !== 'UNDER_INVESTIGATION' &&
            app.status !== 'AWAITING_COMPLIANCE_DECISION' &&
            // EXCLUDE READY_FOR_DECISION if it came from compliance
            !(app.status === 'READY_FOR_DECISION' && app.fromCompliance === true)
          );
        } else if (mode === 'ready-for-decision') {
          // Ready for Decision: Show ALL READY_FOR_DECISION applications (including from compliance)
          filteredApps = apps.filter(app => 
            app.status === 'READY_FOR_DECISION'
          );
          console.log(`[${mode}] After filtering, ${filteredApps.length} applications remain:`, filteredApps);
        } else if (mode === 'completed') {
          // Completed: Show only final statuses
          filteredApps = apps.filter(app => 
            app.status === 'APPROVED' || 
            app.status === 'REJECTED' || 
            app.status === 'DISBURSED' ||
            app.status === 'CANCELLED'
          );
        }
        
        this.applications.set(filteredApps);
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
      // For DOCUMENT_VERIFICATION, also include DOCUMENT_REVERIFICATION
      if (this.statusFilter() === 'DOCUMENT_VERIFICATION') {
        filtered = filtered.filter(app => 
          app.status === 'DOCUMENT_VERIFICATION' || 
          app.status === 'DOCUMENT_REVERIFICATION'
        );
      } else {
        filtered = filtered.filter(app => app.status === this.statusFilter());
      }
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
   * Navigate to application details in VIEW-ONLY mode
   * This will hide action buttons for post-UNDER_REVIEW statuses
   */
  viewApplication(applicationId: string): void {
    const mode = this.filterMode();
    let returnUrl = '/loan-officer/applications/assigned';
    
    // Set return URL based on current filter mode
    if (mode === 'ready-for-decision') {
      returnUrl = '/loan-officer/applications/ready-for-decision';
    } else if (mode === 'pending-documents') {
      returnUrl = '/loan-officer/applications/pending-documents';
    } else if (mode === 'completed') {
      returnUrl = '/loan-officer/applications/completed';
    }
    
    this.router.navigate(['/loan-officer/application', applicationId, 'details'], {
      queryParams: { mode: 'view', returnUrl: returnUrl }
    });
  }

  /**
   * Resume specific step for an application
   */
  resumeStep(applicationId: string, step: string): void {
    // Always navigate to review workflow page
    // The review page will show the appropriate step based on application status
    this.router.navigate(['/loan-officer/application', applicationId, 'review']);
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
   * Get display status (frozen for compliance)
   */
  getDisplayStatus(status: string): string {
    return this.loanOfficerService.getDisplayStatus(status);
  }

  /**
   * Get status badge with compliance indicator
   */
  getStatusBadge(app: LoanApplicationResponse): { text: string; class: string; icon: string } {
    // Check if application came from compliance
    if (app.status === 'READY_FOR_DECISION' && app.fromCompliance === true) {
      if (!app.complianceReviewAcknowledged) {
        return {
          text: 'Reviewed by Compliance',
          class: 'bg-green-100 text-green-800',
          icon: '✅'
        };
      } else {
        return {
          text: 'Ready for Your Decision',
          class: 'bg-emerald-100 text-emerald-800',
          icon: '🎯'
        };
      }
    }
    
    // Default status display
    return {
      text: this.getDisplayStatus(app.status).replace('_', ' '),
      class: this.getStatusBadgeClass(app.status),
      icon: ''
    };
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
      case 'completed':
        return 'Completed Applications';
      default:
        return 'Assigned Applications';
    }
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
      'Purpose',
      'Status',
      'Priority',
      'Risk Level',
      'Submitted Date',
      'Documents Count',
      'Verified Documents'
    ];

    const rows = applications.map(app => [
      app.id ? app.id.substring(0, 8) + '...' : 'N/A',
      app.applicantName || 'N/A',
      app.applicantEmail || 'N/A',
      app.applicantPhone || 'N/A',
      app.loanType || 'N/A',
      app.requestedAmount ? app.requestedAmount.toString() : '0',
      app.tenureMonths ? app.tenureMonths.toString() : '0',
      app.purpose || 'N/A',
      app.status || 'N/A',
      app.priority || 'N/A',
      app.riskLevel || 'N/A',
      app.submittedAt ? this.formatDate(app.submittedAt) : 'N/A',
      app.documentsCount !== undefined ? app.documentsCount.toString() : '0',
      app.verifiedDocumentsCount !== undefined ? app.verifiedDocumentsCount.toString() : '0'
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
    const filename = `loan_applications_${exportTypeLabel}_${timestamp}.csv`;
    
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
    
    // Clear selections after export if exporting selected
    if (exportType === 'selected') {
      this.clearSelections();
    }
  }

  /**
   * Bulk update priority
   */
  bulkUpdatePriority(priority: 'HIGH' | 'MEDIUM' | 'LOW'): void {
    const selected = Array.from(this.selectedApplications());
    
    if (selected.length === 0) {
      this.notificationService.warning('No Selection', 'Please select applications first');
      return;
    }

    // In a real implementation, this would call an API
    // For now, just show a notification
    this.notificationService.success(
      'Priority Updated',
      `Updated priority to ${priority} for ${selected.length} application(s)`
    );
    
    this.clearSelections();
  }

  /**
   * Bulk assign to officer
   */
  bulkAssignToOfficer(): void {
    const selected = Array.from(this.selectedApplications());
    
    if (selected.length === 0) {
      this.notificationService.warning('No Selection', 'Please select applications first');
      return;
    }

    // In a real implementation, this would show a dialog to select officer
    // For now, just show a notification
    this.notificationService.info(
      'Bulk Assignment',
      `Selected ${selected.length} application(s) for assignment`
    );
  }
}
