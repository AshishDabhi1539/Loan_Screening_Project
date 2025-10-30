import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AdminService, UserResponse } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-officer-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './officer-management.component.html',
  styleUrl: './officer-management.component.css'
})
export class OfficerManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // State signals
  officers = signal<UserResponse[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  selectedRole = signal('ALL');
  selectedStatus = signal('ALL');

  // Available filter options
  roleOptions = [
    { value: 'ALL', label: 'All Roles' },
    { value: 'LOAN_OFFICER', label: 'Loan Officer' },
    { value: 'SENIOR_LOAN_OFFICER', label: 'Senior Loan Officer' },
    { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
    { value: 'SENIOR_COMPLIANCE_OFFICER', label: 'Senior Compliance Officer' }
  ];

  statusOptions = [
    { value: 'ALL', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'PENDING_VERIFICATION', label: 'Pending Verification' },
    { value: 'SUSPENDED', label: 'Suspended' }
  ];

  // Computed filtered officers
  filteredOfficers = computed(() => {
    let filtered = this.officers();

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(officer => 
        officer.email.toLowerCase().includes(search) ||
        officer.displayName?.toLowerCase().includes(search) ||
        officer.phone?.toLowerCase().includes(search)
      );
    }

    // Filter by role
    const role = this.selectedRole();
    if (role !== 'ALL') {
      filtered = filtered.filter(officer => officer.role === role);
    }

    // Filter by status
    const status = this.selectedStatus();
    if (status !== 'ALL') {
      filtered = filtered.filter(officer => officer.status === status);
    }

    return filtered;
  });

  // Stats computed from officers
  officerStats = computed(() => {
    const officers = this.officers();
    return {
      total: officers.length,
      active: officers.filter(o => o.status === 'ACTIVE').length,
      inactive: officers.filter(o => o.status === 'INACTIVE').length,
      pending: officers.filter(o => o.status === 'PENDING_VERIFICATION').length,
      loanOfficers: officers.filter(o => o.role === 'LOAN_OFFICER' || o.role === 'SENIOR_LOAN_OFFICER').length,
      complianceOfficers: officers.filter(o => o.role === 'COMPLIANCE_OFFICER' || o.role === 'SENIOR_COMPLIANCE_OFFICER').length
    };
  });

  ngOnInit(): void {
    this.loadOfficers();
  }

  /**
   * Load all officers from the backend
   */
  loadOfficers(): void {
    this.isLoading.set(true);
    
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        // Filter to get only officers (not applicants or admins)
        const officers = users.filter(user => 
          user.role === 'LOAN_OFFICER' || 
          user.role === 'SENIOR_LOAN_OFFICER' || 
          user.role === 'COMPLIANCE_OFFICER' || 
          user.role === 'SENIOR_COMPLIANCE_OFFICER'
        );
        this.officers.set(officers);
        this.isLoading.set(false);
        console.log('Officers loaded successfully:', officers);
      },
      error: (error) => {
        console.error('Error loading officers:', error);
        this.notificationService.error('Error', 'Failed to load officers');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refresh officers list
   */
  refreshOfficers(): void {
    this.loadOfficers();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedRole.set('ALL');
    this.selectedStatus.set('ALL');
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
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const colorMap: { [key: string]: string } = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-gray-100 text-gray-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
      'SUSPENDED': 'bg-red-100 text-red-800'
    };
    return colorMap[status] || 'bg-gray-100 text-gray-800';
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
   * View officer details
   */
  viewOfficer(officer: UserResponse): void {
    this.router.navigate(['/admin/users/officers/view'], {
      state: { officerId: officer.id }
    });
  }

  editOfficer(officer: UserResponse): void {
    console.log('Edit officer:', officer);
    // TODO: Navigate to officer edit page
  }

  toggleOfficerStatus(officer: UserResponse): void {
    console.log('Toggle status for officer:', officer);
    // TODO: Implement status toggle API call
  }
}
