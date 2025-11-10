import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-applicant-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './applicant-applications.component.html',
  styleUrl: './applicant-applications.component.css'
})
export class ApplicantApplicationsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  // State signals
  applicantId = signal<string>('');
  applicantName = signal<string>('');
  applications = signal<any[]>([]);
  isLoading = signal(true);

  // Computed statistics
  applicationStats = computed(() => {
    const apps = this.applications();
    return {
      total: apps.length,
      submitted: apps.filter(a => a.status === 'SUBMITTED').length,
      underReview: apps.filter(a => a.status === 'UNDER_REVIEW').length,
      approved: apps.filter(a => a.status === 'APPROVED').length,
      rejected: apps.filter(a => a.status === 'REJECTED').length,
      pending: apps.filter(a => a.status === 'PENDING_DOCUMENTS').length
    };
  });

  ngOnInit(): void {
    // Get applicant ID from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { applicantId?: string; applicantName?: string };
    
    // Also check history state for page refresh
    const historyState = history.state as { applicantId?: string; applicantName?: string };
    
    const id = state?.applicantId || historyState?.applicantId;
    const name = state?.applicantName || historyState?.applicantName;
    
    if (id) {
      this.applicantId.set(id);
      this.applicantName.set(name || 'Applicant');
      this.loadApplications(id, false); // Don't show notifications on initial load
    } else {
      this.notificationService.error('Error', 'Invalid applicant ID');
      this.router.navigate(['/admin/users/applicants']);
    }
  }

  /**
   * Load applicant's applications
   */
  loadApplications(applicantId: string, showNotifications: boolean = true): void {
    this.isLoading.set(true);
    
    this.adminService.getApplicantApplications(applicantId).subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.isLoading.set(false);
        console.log('✅ Loaded applications:', applications);
        
        // Only show notifications if explicitly requested (e.g., on refresh)
        if (showNotifications) {
          if (applications.length === 0) {
            this.notificationService.info('No Applications', 'This applicant has not submitted any loan applications yet.');
          } else {
            this.notificationService.success('Applications Loaded', `Found ${applications.length} application${applications.length > 1 ? 's' : ''}`);
          }
        }
      },
      error: (error) => {
        console.error('❌ Error loading applications:', error);
        this.isLoading.set(false);
        this.applications.set([]);
        
        // Only show notifications if explicitly requested and it's a real error
        if (showNotifications) {
          if (error.status === 404 || error.status === 0) {
            // 404 or network error when no applications exist - don't show error
            this.notificationService.info('No Applications', 'This applicant has not submitted any loan applications yet.');
          } else {
            this.notificationService.error('Error', 'Unable to load applications. Please try again.');
          }
        }
      }
    });
  }

  /**
   * Navigate back to applicant details
   */
  goBack(): void {
    this.router.navigate(['/admin/users/applicants/view'], {
      state: { applicantId: this.applicantId() }
    });
  }

  /**
   * Refresh applications
   */
  refresh(): void {
    this.loadApplications(this.applicantId(), true); // Show notifications on manual refresh
  }

  /**
   * Get application status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING_DOCUMENTS': 'bg-orange-100 text-orange-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'DISBURSED': 'bg-purple-100 text-purple-800',
      'CANCELLED': 'bg-gray-100 text-gray-800',
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'HIGH': 'bg-red-100 text-red-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-green-100 text-green-800';
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format application status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * View application details
   */
  viewApplication(applicationId: string): void {
    // TODO: Navigate to application details page
    this.notificationService.info('View Application', `Opening application ${applicationId}...`);
  }
}
