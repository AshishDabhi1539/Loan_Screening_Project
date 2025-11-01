import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, CompleteApplicationDetailsResponse } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-application-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './application-review.component.html',
  styleUrl: './application-review.component.css'
})
export class ApplicationReviewComponent implements OnInit {
  router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  currentStep = signal(1);
  totalSteps = 5;

  steps = [
    { number: 1, title: 'Overview', completed: false },
    { number: 2, title: 'Documents', completed: false },
    { number: 3, title: 'External Verification', completed: false },
    { number: 4, title: 'Financial Review', completed: false },
    { number: 5, title: 'Decision', completed: false }
  ];

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (applicationId) {
      this.loadApplicationDetails(applicationId);
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Load application details
   */
  private loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);
    this.loanOfficerService.getCompleteApplicationDetails(applicationId).subscribe({
      next: (details) => {
        this.applicationDetails.set(details);
        this.updateSteps(details);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading application details:', error);
        this.notificationService.error(
          'Error Loading Application',
          'Failed to load application details.'
        );
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Update step completion status
   */
  private updateSteps(details: CompleteApplicationDetailsResponse): void {
    const docs = details.documents || [];
    const verifiedDocs = docs.filter(d => d.verificationStatus === 'VERIFIED').length;
    
    this.steps[0].completed = true;
    this.steps[1].completed = verifiedDocs === docs.length && docs.length > 0;
    this.steps[2].completed = !!details.verificationSummary?.externalVerificationComplete;
    this.steps[3].completed = !!details.financialAssessment;
    this.steps[4].completed = details.applicationInfo.status === 'READY_FOR_DECISION';
  }

  /**
   * Navigate to step
   */
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep.set(step);
    }
  }

  /**
   * Next step
   */
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  /**
   * Previous step
   */
  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  /**
   * Navigate to document verification
   */
  startDocumentVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'document-verification']);
    }
  }

  /**
   * Navigate to external verification
   */
  startExternalVerification(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'external-verification']);
    }
  }

  /**
   * Navigate to decision
   */
  makeDecision(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'decision']);
    }
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return this.loanOfficerService.formatCurrency(amount);
  }

  /**
   * Format date
   */
  formatDate(date: Date | string): string {
    return this.loanOfficerService.formatDate(date);
  }

  /**
   * Get count of verified documents
   */
  getVerifiedDocumentsCount(documents: any[]): number {
    return documents.filter(d => d.verificationStatus === 'VERIFIED').length;
  }
}
