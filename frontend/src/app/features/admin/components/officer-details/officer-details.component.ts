import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminService, OfficerDetailsResponse } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-officer-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './officer-details.component.html',
  styleUrl: './officer-details.component.css'
})
export class OfficerDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  officer = signal<OfficerDetailsResponse | null>(null);
  isLoading = signal(true);
  officerId = signal<string>('');

  ngOnInit(): void {
    // Get officer ID from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { officerId?: string };
    
    // Also check history state for page refresh
    const historyState = history.state as { officerId?: string };
    
    const id = state?.officerId || historyState?.officerId;
    
    if (id) {
      this.officerId.set(id);
      this.loadOfficerDetails(id);
    } else {
      this.notificationService.error('Error', 'Invalid officer ID');
      this.router.navigate(['/admin/users/officers']);
    }
  }

  /**
   * Load officer details from API
   */
  loadOfficerDetails(id: string): void {
    this.isLoading.set(true);
    
    this.adminService.getOfficerById(id).subscribe({
      next: (officer) => {
        this.officer.set(officer);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading officer details:', error);
        this.notificationService.error('Error', 'Failed to load officer details');
        this.isLoading.set(false);
        this.router.navigate(['/admin/users/officers']);
      }
    });
  }

  /**
   * Navigate back to officers list
   */
  goBack(): void {
    this.router.navigate(['/admin/users/officers']);
  }

  /**
   * View officer's assigned applications
   */
  viewAssignedApplications(): void {
    if (this.officerId()) {
      this.router.navigate(['/admin/officers/applications'], {
        state: { officerId: this.officerId(), officerName: this.officer()?.fullName || this.officer()?.email }
      });
    }
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
   * Get role display name
   */
  getRoleDisplayName(role: string): string {
    const roleMap: { [key: string]: string } = {
      'LOAN_OFFICER': 'Loan Officer',
      'SENIOR_LOAN_OFFICER': 'Senior Loan Officer',
      'COMPLIANCE_OFFICER': 'Compliance Officer',
      'SENIOR_COMPLIANCE_OFFICER': 'Senior Compliance Officer'
    };
    return roleMap[role] || role;
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
