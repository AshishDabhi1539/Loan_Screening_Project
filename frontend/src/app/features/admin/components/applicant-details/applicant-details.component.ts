import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, UserResponse } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-applicant-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './applicant-details.component.html',
  styleUrl: './applicant-details.component.css'
})
export class ApplicantDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  applicant = signal<UserResponse | null>(null);
  isLoading = signal(true);
  applicantId = signal<string>('');

  ngOnInit(): void {
    // Get applicant ID from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { applicantId?: string };
    
    // Also check history state for page refresh
    const historyState = history.state as { applicantId?: string };
    
    const id = state?.applicantId || historyState?.applicantId;
    
    if (id) {
      this.applicantId.set(id);
      this.loadApplicantDetails(id);
    } else {
      this.notificationService.error('Error', 'Invalid applicant ID');
      this.router.navigate(['/admin/users/applicants']);
    }
  }

  /**
   * Load applicant details from API
   */
  loadApplicantDetails(id: string): void {
    this.isLoading.set(true);
    
    this.adminService.getApplicantById(id).subscribe({
      next: (applicant) => {
        this.applicant.set(applicant);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applicant details:', error);
        this.notificationService.error('Error', 'Failed to load applicant details');
        this.isLoading.set(false);
        this.router.navigate(['/admin/users/applicants']);
      }
    });
  }

  /**
   * Navigate back to applicants list
   */
  goBack(): void {
    this.router.navigate(['/admin/users/applicants']);
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-red-100 text-red-800',
      'BLOCKED': 'bg-red-200 text-red-900',
      'LOCKED': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get status display name
   */
  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ACTIVE': 'Active',
      'INACTIVE': 'Inactive',
      'PENDING_VERIFICATION': 'Pending Verification',
      'SUSPENDED': 'Suspended',
      'BLOCKED': 'Blocked',
      'LOCKED': 'Locked'
    };
    return statusMap[status] || status;
  }

  /**
   * Format date for display
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
