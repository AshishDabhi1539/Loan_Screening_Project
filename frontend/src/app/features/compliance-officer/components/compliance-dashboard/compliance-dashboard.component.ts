import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ComplianceService, ComplianceDashboardResponse } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-compliance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './compliance-dashboard.component.html',
  styleUrl: './compliance-dashboard.component.css'
})
export class ComplianceDashboardComponent implements OnInit {
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  // State signals
  dashboard = signal<ComplianceDashboardResponse | null>(null);
  isLoading = signal(true);

  // Computed properties
  workloadPercentage = computed(() => {
    const data = this.dashboard();
    if (!data) return 0;
    const total = data.totalAssignedApplications;
    const completed = data.completedThisWeek;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  });

  priorityChartData = computed(() => {
    const data = this.dashboard();
    if (!data) return [];
    return [
      { label: 'Critical', value: data.criticalPriorityApplications, color: 'bg-red-500' },
      { label: 'High', value: data.highPriorityApplications, color: 'bg-orange-500' },
      { label: 'Medium', value: data.mediumPriorityApplications, color: 'bg-yellow-500' },
      { label: 'Low', value: data.lowPriorityApplications, color: 'bg-green-500' }
    ];
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  /**
   * Load dashboard data
   */
  loadDashboard(): void {
    this.isLoading.set(true);
    
    this.complianceService.getDashboard().subscribe({
      next: (data) => {
        this.dashboard.set(data);
        this.isLoading.set(false);
        console.log('✅ Dashboard loaded:', data);
      },
      error: (error) => {
        console.error('❌ Error loading dashboard:', error);
        this.notificationService.error('Error', 'Failed to load dashboard data');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Refresh dashboard
   */
  refresh(): void {
    this.notificationService.info('Refreshing', 'Reloading dashboard...');
    this.loadDashboard();
  }

  /**
   * Navigate to flagged applications
   */
  viewFlaggedApplications(): void {
    this.router.navigate(['/compliance/flagged-applications']);
  }

  /**
   * Navigate to under review applications
   */
  viewUnderReview(): void {
    this.router.navigate(['/compliance/under-review']);
  }

  /**
   * Navigate to pending documents
   */
  viewPendingDocuments(): void {
    this.router.navigate(['/compliance/pending-documents']);
  }

  /**
   * Get status badge color
   */
  getStatusBadgeColor(status: string): string {
    const statusColors: { [key: string]: string } = {
      'FLAGGED_FOR_COMPLIANCE': 'bg-red-100 text-red-800',
      'COMPLIANCE_REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING_COMPLIANCE_DOCS': 'bg-orange-100 text-orange-800',
      'READY_FOR_DECISION': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Get priority badge color
   */
  getPriorityBadgeColor(priority: string): string {
    const priorityColors: { [key: string]: string } = {
      'CRITICAL': 'bg-red-100 text-red-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'LOW': 'bg-green-100 text-green-800',
      'NORMAL': 'bg-green-100 text-green-800'
    };
    return priorityColors[priority] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Format date for display
   */
  formatDate(date: string | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format status for display
   */
  formatStatus(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  /**
   * Navigate to application details
   */
  viewApplication(applicationId: string): void {
    this.router.navigate(['/compliance/applications', applicationId]);
  }
}
