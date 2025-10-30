import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService, UserResponse } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-applicant-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './applicant-management.component.html',
  styleUrl: './applicant-management.component.css'
})
export class ApplicantManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // State signals
  applicants = signal<UserResponse[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedStatus = signal('');

  // Computed properties
  filteredApplicants = computed(() => {
    let filtered = this.applicants();
    
    // Apply search filter
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(applicant => 
        applicant.email.toLowerCase().includes(search) ||
        (applicant.displayName && applicant.displayName.toLowerCase().includes(search)) ||
        (applicant.phone && applicant.phone.includes(search))
      );
    }
    
    // Apply status filter
    const status = this.selectedStatus();
    if (status) {
      filtered = filtered.filter(applicant => applicant.status === status);
    }
    
    return filtered;
  });

  // Statistics
  applicantStats = computed(() => {
    const all = this.applicants();
    return {
      total: all.length,
      active: all.filter(a => a.status === 'ACTIVE').length,
      pending: all.filter(a => a.status === 'PENDING_VERIFICATION').length,
      inactive: all.filter(a => a.status === 'INACTIVE').length
    };
  });

  ngOnInit(): void {
    this.loadApplicants();
  }

  /**
   * Load all applicants from the backend
   */
  loadApplicants(): void {
    this.isLoading.set(true);
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        // Filter to get only applicants
        const applicants = users.filter(user => user.role === 'APPLICANT');
        this.applicants.set(applicants);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applicants:', error);
        this.notificationService.error('Error', 'Failed to load applicants');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('');
  }

  /**
   * View applicant details
   */
  viewApplicant(applicantId: string): void {
    this.router.navigate(['/admin/users/applicants/view'], {
      state: { applicantId: applicantId }
    });
  }

  /**
   * Toggle applicant status
   */
  toggleApplicantStatus(applicantId: string): void {
    // TODO: Implement status toggle
    console.log('Toggle status for applicant:', applicantId);
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-red-100 text-red-800'
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
      'SUSPENDED': 'Suspended'
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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Refresh applicant list
   */
  refresh(): void {
    this.loadApplicants();
  }
}
