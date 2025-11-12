import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService } from '../../../../core/services/loan-officer.service';
import { CompleteApplicationDetailsResponse, ExternalVerificationResponse } from '../../../../core/models/officer.model';
import { ExternalVerificationComponent } from '../external-verification/external-verification.component';

@Component({
  selector: 'app-application-review',
  standalone: true,
  imports: [CommonModule, ExternalVerificationComponent],
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
  isFromCompliance = signal(false);
  showExternalVerification = signal(false);

  steps = signal([
    { number: 1, title: 'Overview', completed: false },
    { number: 2, title: 'Documents', completed: false },
    { number: 3, title: 'External Verification', completed: false },
    { number: 4, title: 'Financial Review', completed: false },
    { number: 5, title: 'Decision', completed: false }
  ]);

  ngOnInit(): void {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (applicationId) {
      this.loadApplicationDetails(applicationId);
      
      // Check if step is specified in query params (e.g., from "Review Workflow" button)
      const stepParam = this.route.snapshot.queryParamMap.get('step');
      if (stepParam) {
        const step = parseInt(stepParam, 10);
        if (step >= 1 && step <= this.totalSteps) {
          this.currentStep.set(step);
        }
      }
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
        
        // Check if application is from compliance
        this.isFromCompliance.set(details.applicationInfo.fromCompliance === true);
        
        // Only auto-set step if not specified in query params
        const stepParam = this.route.snapshot.queryParamMap.get('step');
        if (!stepParam) {
          this.setCurrentStepBasedOnStatus(details);
        }
        
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
   * Set current step based on application status
   */
  private setCurrentStepBasedOnStatus(details: CompleteApplicationDetailsResponse): void {
    const status = details.applicationInfo.status;
    
    // Map application status to review workflow step
    if (status === 'UNDER_REVIEW') {
      this.currentStep.set(1); // Overview
    } else if (status === 'DOCUMENT_VERIFICATION' || status === 'DOCUMENT_INCOMPLETE') {
      this.currentStep.set(2); // Documents
    } else if (status === 'PENDING_EXTERNAL_VERIFICATION' || status === 'EXTERNAL_VERIFICATION' || status === 'FRAUD_CHECK') {
      this.currentStep.set(3); // External Verification
    } else if (status === 'READY_FOR_DECISION') {
      this.currentStep.set(5); // Decision
    } else {
      this.currentStep.set(1); // Default to Overview
    }
  }

  /**
   * Update step completion status based on application progress
   * Uses same logic as Application Details page for consistency
   */
  private updateSteps(details: CompleteApplicationDetailsResponse): void {
    const status = details.applicationInfo.status;
    
    // Update steps signal with new completion status
    this.steps.update(currentSteps => {
      const updatedSteps = currentSteps.map(step => ({ ...step, completed: false }));
      
      // Use same status-based logic as Application Details page
      switch (status) {
        case 'SUBMITTED':
        case 'UNDER_REVIEW':
          // Step 1 (Overview) - Completed
          updatedSteps[0].completed = true;
          break;
          
        case 'DOCUMENT_VERIFICATION':
        case 'DOCUMENT_INCOMPLETE':
          // Step 1 (Overview) - Completed
          updatedSteps[0].completed = true;
          break;
          
        case 'PENDING_EXTERNAL_VERIFICATION':
        case 'FRAUD_CHECK':
        case 'EXTERNAL_VERIFICATION':
          // Steps 1-2 completed
          updatedSteps[0].completed = true;
          updatedSteps[1].completed = true;
          break;
          
        case 'FLAGGED_FOR_COMPLIANCE':
          // Steps 1-3 completed (Submitted, Documents, External Verification)
          updatedSteps[0].completed = true;
          updatedSteps[1].completed = true;
          updatedSteps[2].completed = true;
          break;
          
        case 'READY_FOR_DECISION':
          // Steps 1-4 completed
          updatedSteps[0].completed = true;
          updatedSteps[1].completed = true;
          updatedSteps[2].completed = true;
          updatedSteps[3].completed = true;
          break;
          
        case 'APPROVED':
        case 'REJECTED':
          // All steps completed
          updatedSteps.forEach(step => step.completed = true);
          break;
      }
      
      return updatedSteps;
    });
  }

  /**
   * Navigate to step - with validation
   */
  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) {
      return; // Invalid step number
    }

    const currentStepNum = this.currentStep();
    
    // Allow navigation to previous steps or current step
    if (step <= currentStepNum) {
      this.currentStep.set(step);
      return;
    }

    // For future steps, check if current step is completed
    if (step > currentStepNum) {
      if (this.canProceedToNextStep()) {
        // Can only go to the immediate next step
        if (step === currentStepNum + 1) {
          this.currentStep.set(step);
        } else {
          // Cannot skip steps
          this.notificationService.warning(
            'Cannot Skip Steps',
            'Please complete the current step before proceeding to further steps.'
          );
        }
      } else {
        // Current step not completed
        this.notificationService.warning(
          'Step Not Completed',
          'Please complete the current step before proceeding.'
        );
      }
    }
  }

  /**
   * Next step - with validation
   */
  nextStep(): void {
    if (this.canProceedToNextStep() && this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  /**
   * Check if user can proceed to next step
   */
  canProceedToNextStep(): boolean {
    const details = this.applicationDetails();
    if (!details) return false;

    const currentStepNum = this.currentStep();
    
    switch (currentStepNum) {
      case 1: // Overview - can always proceed
        return true;
        
      case 2: // Documents - all ACTIVE documents must be verified
        const allDocs = details.documents || [];
        const docs = this.getFilteredDocuments(allDocs); // Use filtered documents only
        if (docs.length === 0) return false;
        const allVerified = docs.every(doc => doc.verificationStatus === 'VERIFIED');
        return allVerified;
        
      case 3: // External Verification - must be completed
        return !!details.verificationSummary?.externalVerificationComplete;
        
      case 4: // Financial Review - can proceed if data exists
        return !!details.employmentDetails;
        
      case 5: // Decision - last step
        return false;
        
      default:
        return false;
    }
  }

  /**
   * Check if next button should be disabled
   */
  isNextButtonDisabled(): boolean {
    return this.currentStep() === this.totalSteps || !this.canProceedToNextStep();
  }

  /**
   * Check if a step card is clickable
   */
  isStepClickable(stepNumber: number): boolean {
    const currentStepNum = this.currentStep();
    
    // Can always click on previous steps or current step
    if (stepNumber <= currentStepNum) {
      return true;
    }
    
    // For next step, check if current step is completed
    if (stepNumber === currentStepNum + 1) {
      return this.canProceedToNextStep();
    }
    
    // Cannot click on steps beyond the next step
    return false;
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
    if (this.applicationDetails()?.verificationSummary?.externalVerificationComplete) {
      return;
    }
    this.showExternalVerification.set(true);
  }

  handleExternalVerificationCompleted(_result: ExternalVerificationResponse): void {
    this.showExternalVerification.set(false);
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'details'], {
        queryParams: { tab: 'external' }
      });
    }
  }

  handleExternalVerificationBack(): void {
    this.showExternalVerification.set(false);
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
   * Flag application for compliance review
   */
  flagForCompliance(): void {
    const appId = this.applicationDetails()?.applicationInfo?.id;
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'flag-compliance']);
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
   * Smart document filtering - shows only active/recent versions
   * Same logic as document-verification component
   */
  getFilteredDocuments(documents: any[]): any[] {
    if (!documents || documents.length === 0) return [];
    
    const documentsByType = new Map<string, any[]>();
    
    // Group documents by document type
    documents.forEach(doc => {
      const type = doc.documentType;
      if (!documentsByType.has(type)) {
        documentsByType.set(type, []);
      }
      documentsByType.get(type)!.push(doc);
    });
    
    const filteredDocuments: any[] = [];
    
    documentsByType.forEach((docs, type) => {
      // Separate by verification status
      const pending = docs.filter(d => d.verificationStatus === 'PENDING');
      const verified = docs.filter(d => d.verificationStatus === 'VERIFIED');
      const rejected = docs.filter(d => d.verificationStatus === 'REJECTED');
      
      if (pending.length > 0) {
        // Show latest PENDING (re-uploaded document)
        const latest = pending.sort((a, b) => {
          const dateA = new Date(a.uploadedAt || a.createdAt).getTime();
          const dateB = new Date(b.uploadedAt || b.createdAt).getTime();
          return dateB - dateA;
        })[0];
        filteredDocuments.push(latest);
      } else if (verified.length > 0) {
        // Show VERIFIED document
        filteredDocuments.push(verified[0]);
      } else if (rejected.length > 0) {
        // Show latest REJECTED (if not yet re-uploaded)
        const latest = rejected.sort((a, b) => {
          const dateA = new Date(a.uploadedAt || a.createdAt).getTime();
          const dateB = new Date(b.uploadedAt || b.createdAt).getTime();
          return dateB - dateA;
        })[0];
        filteredDocuments.push(latest);
      }
    });
    
    return filteredDocuments;
  }

  /**
   * Get count of verified documents
   */
  getVerifiedDocumentsCount(documents: any[]): number {
    return documents.filter(d => d.verificationStatus === 'VERIFIED').length;
  }

  /**
   * Check if all documents are verified
   */
  isDocumentVerificationComplete(): boolean {
    const allDocs = this.applicationDetails()?.documents || [];
    const docs = this.getFilteredDocuments(allDocs);
    if (docs.length === 0) return false;
    return this.getVerifiedDocumentsCount(docs) === docs.length;
  }

  /**
   * Get completed steps count
   */
  getCompletedStepsCount(): number {
    return this.steps().filter(s => s.completed).length;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    const completed = this.getCompletedStepsCount();
    return Math.round((completed / this.totalSteps) * 100);
  }

  /**
   * Get current step description
   */
  getCurrentStepDescription(): string {
    const descriptions = [
      'Review the loan application summary and applicant information',
      'Verify all submitted documents for authenticity and completeness',
      'Check external verification results including fraud checks and credit scores',
      'Analyze financial details, income, and repayment capacity',
      'Make the final decision to approve, reject, or flag for compliance'
    ];
    return descriptions[this.currentStep() - 1] || '';
  }

  /**
   * Get step arrow CSS class
   */
  getStepArrowClass(step: any): string {
    if (step.completed && this.currentStep() !== step.number) {
      return 'bg-green-500 text-white cursor-pointer hover:bg-green-600';
    } else if (this.currentStep() === step.number) {
      return 'bg-blue-500 text-white cursor-pointer hover:bg-blue-600';
    } else if (this.isStepClickable(step.number)) {
      return 'bg-gray-300 text-gray-700 cursor-pointer hover:bg-gray-400';
    } else {
      return 'bg-gray-200 text-gray-500 cursor-not-allowed';
    }
  }
}
