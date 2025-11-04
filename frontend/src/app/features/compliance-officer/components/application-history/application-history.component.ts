import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComplianceService, LoanApplicationResponse } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-application-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './application-history.component.html',
  styleUrl: './application-history.component.css'
})
export class ApplicationHistoryComponent implements OnInit {
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private idEncoder = inject(IdEncoderService);

  applications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(true);

  // Filter signals
  searchTerm = signal('');
  selectedStatus = signal<string>('ALL');

  // Status options for history (filter by compliance decision)
  statusOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'APPROVE', label: 'Approved' },
    { value: 'REJECT', label: 'Rejected' }
  ];

  // Computed: Filtered applications
  filteredApplications = computed(() => {
    let filtered = this.applications();

    // Search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(app =>
        app.applicantName?.toLowerCase().includes(search) ||
        app.applicantEmail?.toLowerCase().includes(search) ||
        app.loanType?.toLowerCase().includes(search) ||
        app.id?.toLowerCase().includes(search)
      );
    }

    // Status filter based on compliance decision (APPROVE / REJECT)
    if (this.selectedStatus() !== 'ALL') {
      const sel = this.selectedStatus();
      filtered = filtered.filter(app => this.getComplianceDecision(app) === sel);
    }

    // Sort by last updated (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt).getTime();
      const dateB = new Date(b.lastUpdated || b.createdAt).getTime();
      return dateB - dateA;
    });
  });

  // Pagination
  currentPage = signal(1);
  itemsPerPage = signal(10);
  itemsPerPageOptions = [5, 10, 25, 50, 100];

  paginatedApplications = computed(() => {
    const filtered = this.filteredApplications();
    const start = (this.currentPage() - 1) * this.itemsPerPage();
    const end = start + this.itemsPerPage();
    return filtered.slice(start, end);
  });

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

  /** Pagination handlers for template (avoid arrow functions) */
  setItemsPerPage(size: number): void {
    const val = Number(size) || 10;
    this.itemsPerPage.set(val);
    this.currentPage.set(1);
  }

  goPrevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goNextPage(): void {
    const total = this.totalPages();
    if (total && this.currentPage() < total) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * Load completed applications
   */
  loadApplications(): void {
    this.isLoading.set(true);
    this.complianceService.getCompletedApplications().subscribe({
      next: (data) => {
        this.applications.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading completed applications:', error);
        this.notificationService.error('Error', 'Failed to load application history');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status?.replace(/_/g, ' ') || 'N/A';
  }

  /**
   * Extract compliance decision (APPROVE/REJECT) from complianceNotes
   */
  getComplianceDecision(application: LoanApplicationResponse): string | null {
    if (!application.complianceNotes) {
      return null;
    }
    
    // Look for "Compliance Decision: APPROVE" or "Compliance Decision: REJECT"
    const match = application.complianceNotes.match(/Compliance Decision:\s*(APPROVE|REJECT)/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    
    return null;
  }

  /**
   * Get compliance decision badge color
   */
  getComplianceDecisionColor(decision: string | null): string {
    if (!decision) return 'bg-gray-100 text-gray-800';
    if (decision === 'APPROVE') return 'bg-green-100 text-green-800';
    if (decision === 'REJECT') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'READY_FOR_DECISION':
      case 'AWAITING_COMPLIANCE_DECISION':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Navigate to application details (view-only)
   */
  viewApplication(application: LoanApplicationResponse): void {
    const encodedId = this.idEncoder.encodeId(application.id);
    this.router.navigate(['/compliance-officer/applications/review'], {
      queryParams: { ref: encodedId, from: 'history' }
    });
  }
}

