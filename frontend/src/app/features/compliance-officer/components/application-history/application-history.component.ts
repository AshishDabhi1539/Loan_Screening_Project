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

  // Status options for completed applications
  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'READY_FOR_DECISION', label: 'Ready for Decision' },
    { value: 'AWAITING_COMPLIANCE_DECISION', label: 'Awaiting Decision' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
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

    // Status filter
    if (this.selectedStatus() !== 'ALL') {
      filtered = filtered.filter(app => app.status === this.selectedStatus());
    }

    // Sort by last updated (most recent first)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.lastUpdated || a.createdAt).getTime();
      const dateB = new Date(b.lastUpdated || b.createdAt).getTime();
      return dateB - dateA;
    });
  });

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
      queryParams: { ref: encodedId }
    });
  }
}

