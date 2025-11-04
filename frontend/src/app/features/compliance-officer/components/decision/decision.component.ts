import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ComplianceService, LoanApplicationResponse, ComplianceDecisionResponse } from '../../../../core/services/compliance.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { IdEncoderService } from '../../../../core/services/id-encoder.service';

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.css'
})
export class DecisionComponent implements OnInit {
  private complianceService = inject(ComplianceService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private idEncoder = inject(IdEncoderService);

  applications = signal<LoanApplicationResponse[]>([]);
  isLoading = signal(true);

  // Decision modal state
  showDecisionModal = signal(false);
  selectedApplication = signal<LoanApplicationResponse | null>(null);
  decisionChoice = signal<'APPROVE' | 'REJECT' | null>(null);
  notesToLoanOfficer = signal('');

  ngOnInit(): void {
    this.loadApplications();
  }

  /**
   * Load applications awaiting compliance decision
   */
  loadApplications(): void {
    this.isLoading.set(true);
    this.complianceService.getApplicationsAwaitingDecision().subscribe({
      next: (data) => {
        this.applications.set(data);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading applications:', error);
        this.notificationService.error('Error', 'Failed to load applications');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Open decision modal for an application
   */
  openDecisionModal(application: LoanApplicationResponse): void {
    this.selectedApplication.set(application);
    this.decisionChoice.set(null);
    this.notesToLoanOfficer.set('');
    this.showDecisionModal.set(true);
  }

  /**
   * Close decision modal
   */
  closeDecisionModal(): void {
    this.showDecisionModal.set(false);
    this.selectedApplication.set(null);
    this.decisionChoice.set(null);
    this.notesToLoanOfficer.set('');
  }

  /**
   * Submit compliance decision
   */
  submitDecision(): void {
    const application = this.selectedApplication();
    if (!application) {
      this.notificationService.error('Error', 'Application not selected');
      return;
    }

    const decision = this.decisionChoice();
    if (!decision) {
      this.notificationService.error('Validation', 'Please select Approve or Reject');
      return;
    }

    const notes = this.notesToLoanOfficer().trim();
    if (!notes) {
      this.notificationService.error('Validation', 'Notes to loan officer are required');
      return;
    }

    this.complianceService.submitComplianceDecision(application.id, {
      decision,
      notesToLoanOfficer: notes
    }).subscribe({
      next: () => {
        this.notificationService.success(
          'Decision Submitted',
          `Your ${decision} decision has been submitted. The loan officer has been notified.`
        );
        this.closeDecisionModal();
        // Reload applications
        this.loadApplications();
      },
      error: (err: any) => {
        console.error('Error submitting decision:', err);
        this.notificationService.error('Error', err.error?.message || 'Failed to submit decision');
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
   * Format date for display
   */
  formatDate(date: string | Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  /**
   * Navigate to application details
   */
  viewApplication(application: LoanApplicationResponse): void {
    const encodedId = this.idEncoder.encodeId(application.id);
    this.router.navigate(['/compliance-officer/applications/review'], {
      queryParams: { ref: encodedId }
    });
  }
}

