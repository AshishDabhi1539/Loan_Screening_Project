import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { LoanOfficerService, LoanApplicationResponse } from '../../../../core/services/loan-officer.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-loan-applications',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './loan-applications.component.html',
  styleUrl: './loan-applications.component.css'
})
export class LoanApplicationsComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loanOfficerService = inject(LoanOfficerService);
  private notificationService = inject(NotificationService);

  // Real backend data - NO STATIC DATA!
  allApplications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(false);
  
  // Filter states
  selectedStatus = signal<string>('ALL');
  selectedLoanType = signal<string>('ALL');
  selectedPriority = signal<string>('ALL');
  searchQuery = signal<string>('');
  sortBy = signal<string>('submittedAt');
  sortOrder = signal<'asc' | 'desc'>('desc');

  // Pagination
  currentPage = signal(1);
  itemsPerPage = 10;
  
  // Math for template
  Math = Math;

  // Available filter options
  statusOptions = [
    'ALL',
    'SUBMITTED',
    'UNDER_REVIEW',
    'DOCUMENT_VERIFICATION',
    'PENDING_EXTERNAL_VERIFICATION',
    'READY_FOR_DECISION',
    'APPROVED',
    'REJECTED',
    'FLAGGED_FOR_COMPLIANCE'
  ];

  loanTypeOptions = [
    'ALL',
    'PERSONAL_LOAN',
    'HOME_LOAN',
    'CAR_LOAN',
    'TWO_WHEELER_LOAN',
    'EDUCATION_LOAN',
    'BUSINESS_LOAN',
    'GOLD_LOAN',
    'PROPERTY_LOAN'
  ];

  priorityOptions = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

  sortOptions = [
    { value: 'submittedAt', label: 'Submission Date' },
    { value: 'requestedAmount', label: 'Loan Amount' },
    { value: 'applicantName', label: 'Applicant Name' },
    { value: 'priority', label: 'Priority' }
  ];

  // Computed filtered and sorted applications
  filteredApplications = computed(() => {
    let apps = this.allApplications();
    const status = this.selectedStatus();
    const loanType = this.selectedLoanType();
    const priority = this.selectedPriority();
    const query = this.searchQuery().toLowerCase();

    // Apply status filter
    if (status !== 'ALL') {
      apps = apps.filter(app => app.status === status);
    }

    // Apply loan type filter
    if (loanType !== 'ALL') {
      apps = apps.filter(app => app.loanType === loanType);
    }

    // Apply priority filter
    if (priority !== 'ALL') {
      apps = apps.filter(app => app.priority === priority);
    }

    // Apply search query
    if (query) {
      apps = apps.filter(app => 
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantEmail.toLowerCase().includes(query) ||
        app.id.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sortByField = this.sortBy();
    const order = this.sortOrder();
    
    apps = [...apps].sort((a, b) => {
      let compareA: any = a[sortByField as keyof LoanApplicationResponse];
      let compareB: any = b[sortByField as keyof LoanApplicationResponse];

      // Handle date sorting
      if (sortByField === 'submittedAt') {
        compareA = new Date(compareA).getTime();
        compareB = new Date(compareB).getTime();
      }

      if (compareA < compareB) return order === 'asc' ? -1 : 1;
      if (compareA > compareB) return order === 'asc' ? 1 : -1;
      return 0;
    });

    return apps;
  });

  // Paginated applications
  paginatedApplications = computed(() => {
    const apps = this.filteredApplications();
    const page = this.currentPage();
    const start = (page - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return apps.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredApplications().length / this.itemsPerPage);
  });

  totalApplications = computed(() => this.filteredApplications().length);

  ngOnInit(): void {
    // Check for filter from query params (e.g., from dashboard)
    this.route.queryParams.subscribe(params => {
      if (params['filter'] === 'ready-for-decision') {
        this.selectedStatus.set('READY_FOR_DECISION');
      }
    });

    // Load real data from backend
    this.loadApplications();
  }

  /**
   * Load applications from real backend API - NO STATIC DATA!
   */
  loadApplications(): void {
    this.isLoading.set(true);
    
    this.loanOfficerService.getAssignedApplications().subscribe({
      next: (applications) => {
        this.allApplications.set(applications);
        this.isLoading.set(false);
        console.log(`Loaded ${applications.length} applications from backend`);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.notificationService.error('Error', 'Failed to load applications');
        this.isLoading.set(false);
      }
    });
  }

  refreshApplications(): void {
    this.notificationService.info('Refresh', 'Refreshing applications...');
    this.loadApplications();
  }

  onStatusChange(status: string): void {
    this.selectedStatus.set(status);
    this.currentPage.set(1);
  }

  onLoanTypeChange(loanType: string): void {
    this.selectedLoanType.set(loanType);
    this.currentPage.set(1);
  }

  onPriorityChange(priority: string): void {
    this.selectedPriority.set(priority);
    this.currentPage.set(1);
  }

  onSearchChange(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
  }

  onSortChange(sortBy: string): void {
    if (this.sortBy() === sortBy) {
      // Toggle sort order
      this.sortOrder.set(this.sortOrder() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(sortBy);
      this.sortOrder.set('desc');
    }
  }

  clearFilters(): void {
    this.selectedStatus.set('ALL');
    this.selectedLoanType.set('ALL');
    this.selectedPriority.set('ALL');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  viewApplication(applicationId: string): void {
    this.router.navigate(['/loan-officer/applications', applicationId, 'details']);
  }

  startReview(applicationId: string): void {
    this.router.navigate(['/loan-officer/applications', applicationId, 'details']);
  }

  // Helper methods from service
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

  getRiskLevelBadgeClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  formatLoanType(loanType: string): string {
    return loanType.replace(/_/g, ' ');
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

  getPaginationArray(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      range.unshift(-1); // Ellipsis
    }
    if (current + delta < total - 1) {
      range.push(-1); // Ellipsis
    }

    range.unshift(1);
    if (total > 1) {
      range.push(total);
    }

    return range;
  }
}
