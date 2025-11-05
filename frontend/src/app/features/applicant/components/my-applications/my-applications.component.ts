import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { LoanApplicationResponse } from '../../../../core/models/loan-application.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { LoanApplicationSummary } from '../../../../core/models/dashboard.model';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-my-applications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-applications.component.html',
  styleUrl: './my-applications.component.css'
})
export class MyApplicationsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly loanApplicationService = inject(LoanApplicationService);
  private readonly dashboardService = inject(DashboardService);
  private readonly notificationService = inject(NotificationService);

  isLoading = signal(false);
  applications = signal<LoanApplicationSummary[]>([]);
  filterStatus = signal<string>('ALL');

  filteredApplications = computed(() => {
    const status = this.filterStatus();
    if (status === 'ALL') return this.applications();
    return this.applications().filter(a => a.status === status);
  });

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.isLoading.set(true);
    this.loanApplicationService.getMyApplications().subscribe({
      next: (apps: LoanApplicationResponse[]) => {
        // Reuse dashboard transformation for consistency
        const summaries = (apps || []).map(app => ({
          id: app.id,
          loanType: app.loanType,
          requestedAmount: Number(app.requestedAmount) || 0,
          status: app.status,
          submittedDate: new Date(app.submittedAt || app.createdAt || Date.now()),
          lastUpdated: new Date(app.updatedAt || Date.now()),
          nextAction: undefined,
          progress: 0,
          applicantName: app.applicantName,
          assignedOfficerName: undefined,
          hasPersonalDetails: undefined,
          hasFinancialProfile: undefined,
          documentsCount: undefined,
          employmentType: undefined
        })) as LoanApplicationSummary[];

        // Enrich with progress and nextAction via DashboardService helpers
        const enriched = summaries.map(s => ({
          ...s,
          progress: (this as any).dashboardService['calculateProgress']
            ? (this as any).dashboardService['calculateProgress'](s.status)
            : s.progress,
          nextAction: (this as any).dashboardService['getNextAction']
            ? (this as any).dashboardService['getNextAction'](s.status)
            : s.nextAction
        }));

        this.applications.set(enriched);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load applications', err);
        this.notificationService.error('Error', 'Unable to load applications');
        this.isLoading.set(false);
      }
    });
  }

  setFilter(status: string): void {
    this.filterStatus.set(status);
  }

  getStatusDisplay(status: string): string {
    return this.dashboardService.getStatusDisplay(status);
  }

  getStatusBadgeColor(status: string): string {
    return this.dashboardService.getStatusBadgeColor(status);
  }

  formatCurrency(amount: number): string {
    return this.dashboardService.formatCurrency(amount);
  }

  formatDate(date: Date): string {
    return this.dashboardService.formatDate(date);
  }

  viewApplication(applicationId: string): void {
    const app = this.applications().find(a => a.id === applicationId);
    if (!app) {
      this.notificationService.error('Error', 'Application not found');
      return;
    }

    // Draft vs submitted handling similar to dashboard
    if (app.status !== 'DRAFT') {
      this.router.navigate(['/applicant/application-details', app.id]);
      return;
    }

    // For draft, navigate to personal or employment based on what we know
    if (!app.hasPersonalDetails) {
      this.router.navigate(['/applicant/personal-details']);
      return;
    }
    if (!app.hasFinancialProfile) {
      this.router.navigate(['/applicant/employment-details'], {
        queryParams: { applicationId: app.id }
      });
      return;
    }

    this.router.navigate(['/applicant/document-upload'], {
      queryParams: { applicationId: app.id }
    });
  }
}


