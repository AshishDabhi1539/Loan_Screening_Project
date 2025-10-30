import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-officer-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './officer-applications.component.html',
  styleUrl: './officer-applications.component.css'
})
export class OfficerApplicationsComponent implements OnInit {
  private router = inject(Router);
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);

  applications = signal<any[]>([]);
  isLoading = signal(true);
  officerId = signal<string>('');
  officerName = signal<string>('');

  ngOnInit(): void {
    // Get officer ID from router state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state as { officerId?: string; officerName?: string };
    
    // Also check history state for page refresh
    const historyState = history.state as { officerId?: string; officerName?: string };
    
    const id = state?.officerId || historyState?.officerId;
    const name = state?.officerName || historyState?.officerName;
    
    if (id) {
      this.officerId.set(id);
      this.officerName.set(name || 'Officer');
      this.loadAssignedApplications(id);
    } else {
      this.notificationService.error('Error', 'Invalid officer ID');
      this.router.navigate(['/admin/users/officers']);
    }
  }

  /**
   * Load assigned applications from API
   */
  loadAssignedApplications(id: string): void {
    this.isLoading.set(true);
    
    this.adminService.getOfficerAssignedApplications(id).subscribe({
      next: (applications) => {
        this.applications.set(applications);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading assigned applications:', error);
        this.notificationService.error('Error', 'Failed to load assigned applications');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Navigate back to officer details
   */
  goBack(): void {
    this.router.navigate(['/admin/users/officers/view'], {
      state: { officerId: this.officerId() }
    });
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'DRAFT': 'bg-gray-100 text-gray-800',
      'SUBMITTED': 'bg-blue-100 text-blue-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'PENDING': 'bg-orange-100 text-orange-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
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
   * Format currency
   */
  formatCurrency(amount: number | null | undefined): string {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  }
}
