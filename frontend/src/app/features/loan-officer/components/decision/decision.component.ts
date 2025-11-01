import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService, LoanDecisionRequest, ComplianceFlagRequest } from '../../../../core/services/loan-officer.service';

@Component({
  selector: 'app-decision',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './decision.component.html',
  styleUrl: './decision.component.css'
})
export class DecisionComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);
  private loanOfficerService = inject(LoanOfficerService);

  isLoading = signal(false);
  isSubmitting = signal(false);
  applicationId = signal<string | null>(null);
  decisionType = signal<'approve' | 'reject' | 'flag' | null>(null);

  approveForm: FormGroup = this.fb.group({
    approvedAmount: ['', [Validators.required, Validators.min(0)]],
    approvedTenure: ['', [Validators.required, Validators.min(1)]],
    approvedInterestRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    decisionReason: ['', [Validators.required, Validators.minLength(10)]],
    conditions: this.fb.array([]),
    internalNotes: ['']
  });

  rejectForm: FormGroup = this.fb.group({
    decisionReason: ['', [Validators.required, Validators.minLength(10)]],
    internalNotes: ['']
  });

  flagForm: FormGroup = this.fb.group({
    flagReason: ['', [Validators.required, Validators.minLength(10)]],
    suspiciousActivities: this.fb.array([this.fb.control('', Validators.required)]),
    priority: ['HIGH', Validators.required],
    additionalEvidence: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId.set(id);
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Set decision type
   */
  setDecisionType(type: 'approve' | 'reject' | 'flag'): void {
    this.decisionType.set(type);
  }

  /**
   * Add condition
   */
  addCondition(): void {
    const conditionsArray = this.approveForm.get('conditions') as FormArray;
    conditionsArray.push(this.fb.control('', Validators.required));
  }

  /**
   * Remove condition
   */
  removeCondition(index: number): void {
    const conditionsArray = this.approveForm.get('conditions') as FormArray;
    conditionsArray.removeAt(index);
  }

  /**
   * Get conditions array
   */
  getConditionsArray(): FormArray {
    return this.approveForm.get('conditions') as FormArray;
  }

  /**
   * Add suspicious activity
   */
  addSuspiciousActivity(): void {
    const activitiesArray = this.flagForm.get('suspiciousActivities') as FormArray;
    activitiesArray.push(this.fb.control('', Validators.required));
  }

  /**
   * Remove suspicious activity
   */
  removeSuspiciousActivity(index: number): void {
    const activitiesArray = this.flagForm.get('suspiciousActivities') as FormArray;
    activitiesArray.removeAt(index);
  }

  /**
   * Get suspicious activities array
   */
  getSuspiciousActivitiesArray(): FormArray {
    return this.flagForm.get('suspiciousActivities') as FormArray;
  }

  /**
   * Submit approval
   */
  submitApproval(): void {
    if (this.approveForm.invalid) {
      this.notificationService.error('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    const appId = this.applicationId();
    if (!appId) return;

    this.isSubmitting.set(true);
    const formValue = this.approveForm.value;

    const request: LoanDecisionRequest = {
      approvedAmount: parseFloat(formValue.approvedAmount),
      approvedTenure: parseInt(formValue.approvedTenure),
      approvedInterestRate: parseFloat(formValue.approvedInterestRate),
      decisionReason: formValue.decisionReason,
      conditions: formValue.conditions.filter((c: string) => c.trim().length > 0),
      internalNotes: formValue.internalNotes || undefined
    };

    this.loanOfficerService.approveApplication(appId, request).subscribe({
      next: () => {
        this.notificationService.success(
          'Application Approved',
          'The loan application has been approved successfully.'
        );
        this.router.navigate(['/loan-officer/application', appId, 'details']);
      },
      error: (error) => {
        console.error('Error approving application:', error);
        this.notificationService.error(
          'Approval Failed',
          'Failed to approve the application. Please try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Submit rejection
   */
  submitRejection(): void {
    if (this.rejectForm.invalid) {
      this.notificationService.error('Validation Error', 'Please provide a rejection reason.');
      return;
    }

    const appId = this.applicationId();
    if (!appId) return;

    this.isSubmitting.set(true);
    const formValue = this.rejectForm.value;

    const request: LoanDecisionRequest = {
      decisionReason: formValue.decisionReason,
      internalNotes: formValue.internalNotes || undefined
    };

    this.loanOfficerService.rejectApplication(appId, request).subscribe({
      next: () => {
        this.notificationService.success(
          'Application Rejected',
          'The loan application has been rejected.'
        );
        this.router.navigate(['/loan-officer/application', appId, 'details']);
      },
      error: (error) => {
        console.error('Error rejecting application:', error);
        this.notificationService.error(
          'Rejection Failed',
          'Failed to reject the application. Please try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Submit compliance flag
   */
  submitFlag(): void {
    if (this.flagForm.invalid) {
      this.notificationService.error('Validation Error', 'Please fill all required fields.');
      return;
    }

    const appId = this.applicationId();
    if (!appId) return;

    this.isSubmitting.set(true);
    const formValue = this.flagForm.value;

    const request: ComplianceFlagRequest = {
      flagReason: formValue.flagReason,
      suspiciousActivities: formValue.suspiciousActivities.filter((a: string) => a.trim().length > 0),
      priority: formValue.priority,
      additionalEvidence: formValue.additionalEvidence || undefined
    };

    this.loanOfficerService.flagForCompliance(appId, request).subscribe({
      next: () => {
        this.notificationService.success(
          'Application Flagged',
          'The application has been flagged for compliance review.'
        );
        this.router.navigate(['/loan-officer/application', appId, 'details']);
      },
      error: (error) => {
        console.error('Error flagging application:', error);
        this.notificationService.error(
          'Flagging Failed',
          'Failed to flag the application. Please try again.'
        );
        this.isSubmitting.set(false);
      }
    });
  }

  /**
   * Cancel decision
   */
  cancel(): void {
    const appId = this.applicationId();
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'details']);
    } else {
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }
}
