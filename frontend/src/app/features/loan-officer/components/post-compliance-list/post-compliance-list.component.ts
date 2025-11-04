import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanOfficerService, LoanApplicationResponse } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-post-compliance-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-compliance-list.component.html',
  styleUrls: ['./post-compliance-list.component.css']
})
export class PostComplianceListComponent implements OnInit {
  applications = signal<LoanApplicationResponse[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  // Computed signals for filtering
  flaggedApplications = computed(() => 
    this.applications().filter(app => app.status === 'FLAGGED_FOR_COMPLIANCE')
  );

  underInvestigationApplications = computed(() => 
    this.applications().filter(app => app.status === 'UNDER_INVESTIGATION')
  );

  awaitingDecisionApplications = computed(() => 
    this.applications().filter(app => app.status === 'AWAITING_COMPLIANCE_DECISION')
  );

  readyForReviewApplications = computed(() => 
    this.applications().filter(app => 
      app.status === 'READY_FOR_DECISION' && 
      app.fromCompliance === true &&
      app.complianceReviewAcknowledged === false
    )
  );

  readyForDecisionApplications = computed(() => 
    this.applications().filter(app => 
      app.status === 'READY_FOR_DECISION' && 
      app.fromCompliance === true &&
      app.complianceReviewAcknowledged === true
    )
  );

  totalCount = computed(() => this.applications().length);

  constructor(
    private loanOfficerService: LoanOfficerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.loading.set(true);
    this.error.set(null);

    this.loanOfficerService.getPostComplianceApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading post-compliance applications:', err);
        this.error.set('Failed to load applications. Please try again.');
        this.loading.set(false);
      }
    });
  }

  /**
   * Navigate to application details page (same as Assigned Applications)
   */
  viewApplication(applicationId: string): void {
    this.router.navigate(['/loan-officer/application', applicationId, 'details'], {
      queryParams: { returnUrl: '/loan-officer/applications/post-compliance' }
    });
  }

  getStatusBadge(application: LoanApplicationResponse): { text: string; class: string; icon: string } {
    if (application.status === 'FLAGGED_FOR_COMPLIANCE') {
      return {
        text: 'Flagged for Compliance',
        class: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: '🔍'
      };
    }
    if (application.status === 'UNDER_INVESTIGATION') {
      return {
        text: 'Under Investigation',
        class: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: '🔬'
      };
    }
    if (application.status === 'AWAITING_COMPLIANCE_DECISION') {
      return {
        text: 'Awaiting Compliance Decision',
        class: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: '⏳'
      };
    }
    if (application.status === 'READY_FOR_DECISION' && application.fromCompliance) {
      if (!application.complianceReviewAcknowledged) {
        return {
          text: 'Reviewed by Compliance',
          class: 'bg-green-100 text-green-800 border-green-300',
          icon: '✅'
        };
      } else {
        return {
          text: 'Ready for Your Decision',
          class: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: '🎯'
        };
      }
    }
    return {
      text: application.status,
      class: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '📋'
    };
  }

  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  getPriorityClass(priority: string): string {
    return this.loanOfficerService.getPriorityBadgeClass(priority);
  }

  getRiskLevelClass(riskLevel: string): string {
    return this.loanOfficerService.getRiskLevelBadgeClass(riskLevel);
  }
}
