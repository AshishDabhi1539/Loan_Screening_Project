import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';

import { NotificationService } from '../../../../core/services/notification.service';
import { LoanOfficerService } from '../../../../core/services/loan-officer.service';
import { LoanDecisionRequest, ComplianceFlagRequest, CompleteApplicationDetailsResponse } from '../../../../core/models/officer.model';

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
  applicationDetails = signal<CompleteApplicationDetailsResponse | null>(null);
  isFromCompliance = signal<boolean>(false);
  complianceInvestigationData = signal<any>(null);
  showInvestigationDetails = signal<boolean>(false);

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

  // Computed signal for EMI calculations
  emiDetails = computed(() => {
    const amount = this.approveForm.get('approvedAmount')?.value || 0;
    const tenure = this.approveForm.get('approvedTenure')?.value || 0;
    const rate = this.approveForm.get('approvedInterestRate')?.value || 0;
    
    if (!amount || !tenure || !rate || amount <= 0 || tenure <= 0 || rate <= 0) {
      return null;
    }
    
    // EMI Formula: P × r × (1+r)^n / ((1+r)^n - 1)
    const monthlyRate = rate / 12 / 100;
    const emi = (amount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    const totalInterest = (emi * tenure) - amount;
    const totalRepayment = emi * tenure;
    
    // FOIR calculation
    const monthlyIncome = this.applicationDetails()?.employmentDetails?.monthlyIncome || 0;
    const foirRatio = monthlyIncome > 0 ? (emi / monthlyIncome) * 100 : 0;
    
    let foirStatus: 'EXCELLENT' | 'GOOD' | 'MODERATE' | 'HIGH_RISK';
    if (foirRatio <= 35) foirStatus = 'EXCELLENT';
    else if (foirRatio <= 40) foirStatus = 'GOOD';
    else if (foirRatio <= 50) foirStatus = 'MODERATE';
    else foirStatus = 'HIGH_RISK';
    
    return {
      monthlyEmi: emi,
      totalInterest,
      totalRepayment,
      foirRatio,
      foirStatus
    };
  });

  // Validation warnings
  validationWarnings = computed(() => {
    const warnings: string[] = [];
    const appDetails = this.applicationDetails();
    if (!appDetails) return warnings;
    
    const approvedAmount = this.approveForm.get('approvedAmount')?.value || 0;
    const approvedTenure = this.approveForm.get('approvedTenure')?.value || 0;
    const approvedRate = this.approveForm.get('approvedInterestRate')?.value || 0;
    const recommendedRate = this.calculateRecommendedRate(appDetails);
    
    if (approvedAmount > appDetails.applicationInfo.loanAmount) {
      warnings.push('⚠️ Approved amount exceeds requested amount');
    }
    
    if (approvedTenure > appDetails.applicationInfo.tenureMonths) {
      warnings.push('⚠️ Approved tenure exceeds requested tenure');
    }
    
    const emi = this.emiDetails();
    if (emi && emi.foirRatio > 40) {
      warnings.push('⚠️ EMI exceeds 40% of income - High default risk');
    }
    
    if (Math.abs(approvedRate - recommendedRate) > 2) {
      warnings.push(`⚠️ Interest rate deviates significantly from recommended rate (${recommendedRate.toFixed(2)}%)`);
    }
    
    return warnings;
  });

  constructor() {
    // React to form changes for real-time EMI calculation
    effect(() => {
      // This effect will run whenever form values change
      // The emiDetails computed signal will automatically recalculate
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.applicationId.set(id);
      this.loadApplicationDetails(id);
    } else {
      this.notificationService.error('Error', 'Application ID is missing');
      this.router.navigate(['/loan-officer/applications/assigned']);
    }
  }

  /**
   * Load application details for smart pre-fill
   */
  loadApplicationDetails(applicationId: string): void {
    this.isLoading.set(true);
    this.loanOfficerService.getCompleteApplicationDetails(applicationId).subscribe({
      next: (data: CompleteApplicationDetailsResponse) => {
        this.applicationDetails.set(data);
        // Check if application is from compliance
        const isFromComp = data.applicationInfo.fromCompliance === true;
        this.isFromCompliance.set(isFromComp);
        console.log('Decision page - fromCompliance:', isFromComp);
        console.log('Decision page - complianceNotes:', data.applicationInfo.complianceNotes);
        
        // If from compliance, try to load the detailed investigation data
        if (isFromComp) {
          this.loadComplianceInvestigationData(applicationId);
        }
        
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading application details:', error);
        this.notificationService.error('Error', 'Failed to load application details');
        this.isLoading.set(false);
      }
    });
  }

  loadComplianceInvestigationData(applicationId: string): void {
    this.loanOfficerService.getComplianceInvestigationData(applicationId).subscribe({
      next: (data: any) => {
        console.log('✅ Compliance investigation data loaded successfully!');
        console.log('Raw Investigation Data:', data);
        
        // Deep parse - handle nested JSON strings
        let parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Parse nested JSON strings if they exist
        if (parsedData.bank_details && typeof parsedData.bank_details === 'string') {
          try {
            parsedData.bank_details = JSON.parse(parsedData.bank_details);
          } catch (e) {
            console.warn('Could not parse bank_details');
          }
        }
        
        if (parsedData.fraud_records && typeof parsedData.fraud_records === 'string') {
          try {
            parsedData.fraud_records = JSON.parse(parsedData.fraud_records);
          } catch (e) {
            console.warn('Could not parse fraud_records');
          }
        }
        
        if (parsedData.loan_history && typeof parsedData.loan_history === 'string') {
          try {
            parsedData.loan_history = JSON.parse(parsedData.loan_history);
          } catch (e) {
            console.warn('Could not parse loan_history');
          }
        }
        
        if (parsedData.applicantProfile && typeof parsedData.applicantProfile === 'string') {
          try {
            parsedData.applicantProfile = JSON.parse(parsedData.applicantProfile);
          } catch (e) {
            console.warn('Could not parse applicantProfile');
          }
        }
        
        this.complianceInvestigationData.set(parsedData);
        console.log('✅ Fully Parsed Investigation Data:', JSON.stringify(parsedData, null, 2));
        console.log('Bank Details:', JSON.stringify(parsedData.bank_details, null, 2));
        console.log('Fraud Records:', JSON.stringify(parsedData.fraud_records, null, 2));
        console.log('Loan History:', JSON.stringify(parsedData.loan_history, null, 2));
        console.log('Overall Assessment:', parsedData.overallAssessment);
        console.log('Consolidated Findings:', parsedData.consolidatedFindings);
      },
      error: (error: any) => {
        console.warn('⚠️ No compliance investigation data found (this is okay if compliance only added notes)');
        console.log('Error details:', error);
        // Don't show error to user, just log it - fallback to complianceNotes
      }
    });
  }

  /**
   * Smart pre-fill approval form based on application data
   */
  preFillApprovalForm(data: CompleteApplicationDetailsResponse): void {
    const recommendedRate = this.calculateRecommendedRate(data);
    const decisionReason = this.generateDecisionReason(data);
    
    // Pre-fill with requested amount and tenure
    this.approveForm.patchValue({
      approvedAmount: data.applicationInfo.loanAmount,
      approvedTenure: data.applicationInfo.tenureMonths,
      approvedInterestRate: recommendedRate,
      decisionReason: decisionReason
    });
  }

  /**
   * Calculate recommended interest rate based on credit score and risk level
   */
  calculateRecommendedRate(data: CompleteApplicationDetailsResponse): number {
    const creditScore = data.externalVerification?.creditScore || 0;
    const riskLevel = data.externalVerification?.riskLevel || 'UNKNOWN';
    
    // Risk-based pricing
    if (creditScore >= 750 && riskLevel === 'LOW') return 10.5;
    if (creditScore >= 700 && (riskLevel === 'LOW' || riskLevel === 'MEDIUM')) return 11.5;
    if (creditScore >= 650 && riskLevel === 'MEDIUM') return 12.5;
    if (creditScore >= 600) return 13.5;
    if (creditScore >= 550) return 14.5;
    if (creditScore >= 500) return 15.5;
    return 16.5; // High risk
  }

  /**
   * Generate decision reason based on application data
   */
  generateDecisionReason(data: CompleteApplicationDetailsResponse): string {
    const creditScore = data.externalVerification?.creditScore || 0;
    const riskLevel = data.externalVerification?.riskLevel || 'UNKNOWN';
    const hasDefaults = data.externalVerification?.hasDefaults || false;
    const activeFraudCases = data.externalVerification?.activeFraudCases || 0;
    
    if (activeFraudCases > 0) {
      return `Application flagged due to ${activeFraudCases} active fraud case(s). Requires compliance review before approval.`;
    }
    
    if (hasDefaults) {
      return `Applicant has loan default history. Approved with caution and additional monitoring required.`;
    }
    
    if (creditScore >= 750 && riskLevel === 'LOW') {
      return `Excellent credit profile with score ${creditScore}. Strong repayment capacity. No adverse history found.`;
    }
    
    if (creditScore >= 650 && (riskLevel === 'LOW' || riskLevel === 'MEDIUM')) {
      return `Good credit score ${creditScore}. Stable employment and income verified. Approved with standard terms.`;
    }
    
    if (creditScore >= 550) {
      return `Fair credit score ${creditScore}. Approved with enhanced monitoring and risk-adjusted terms.`;
    }
    
    return `Credit score ${creditScore} requires careful assessment. Additional collateral or guarantor recommended.`;
  }

  /**
   * Add risk-based conditions
   */
  addRiskBasedConditions(riskLevel: string): void {
    const conditionsArray = this.approveForm.get('conditions') as FormArray;
    conditionsArray.clear();
    
    if (riskLevel === 'HIGH' || riskLevel === 'VERY_HIGH' || riskLevel === 'CRITICAL') {
      conditionsArray.push(this.fb.control('Submit additional income proof within 7 days', Validators.required));
      conditionsArray.push(this.fb.control('Provide co-applicant/guarantor details', Validators.required));
      conditionsArray.push(this.fb.control('Collateral valuation required before disbursement', Validators.required));
    } else if (riskLevel === 'MEDIUM') {
      conditionsArray.push(this.fb.control('Salary account statements for last 6 months', Validators.required));
      conditionsArray.push(this.fb.control('Employment verification letter from HR', Validators.required));
    } else {
      conditionsArray.push(this.fb.control('Standard documentation as per policy', Validators.required));
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
      decisionType: 'APPROVED',
      approvedAmount: parseFloat(formValue.approvedAmount),
      approvedTenureMonths: parseInt(formValue.approvedTenure),
      approvedInterestRate: parseFloat(formValue.approvedInterestRate),
      decisionReason: formValue.decisionReason,
      additionalNotes: formValue.internalNotes || undefined,
      requiresComplianceReview: false
    };

    this.loanOfficerService.approveApplication(appId, request).subscribe({
      next: () => {
        this.notificationService.success(
          'Application Approved',
          'The loan application has been approved successfully.'
        );
        // Pass approval details via route state
        this.router.navigate(['/loan-officer/application', appId, 'approval-summary'], {
          state: {
            approvalData: {
              approvedAmount: parseFloat(formValue.approvedAmount),
              approvedTenureMonths: parseInt(formValue.approvedTenure),
              approvedInterestRate: parseFloat(formValue.approvedInterestRate),
              decisionReason: formValue.decisionReason
            }
          }
        });
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
      decisionType: 'REJECTED',
      rejectionReason: formValue.decisionReason,
      decisionReason: formValue.decisionReason,
      additionalNotes: formValue.internalNotes || undefined
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
   * Toggle investigation details visibility
   */
  toggleInvestigationDetails(): void {
    this.showInvestigationDetails.set(!this.showInvestigationDetails());
  }

  /**
   * Safely get nested property value
   */
  getNestedValue(obj: any, path: string): any {
    if (!obj) return null;
    const value = path.split('.').reduce((acc, part) => acc && acc[part], obj);
    return value !== undefined && value !== null ? value : null;
  }

  /**
   * Format value for display
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  /**
   * View full compliance review
   */
  viewFullComplianceReview(): void {
    const appId = this.applicationId();
    if (appId) {
      this.router.navigate(['/loan-officer/application', appId, 'details']);
    }
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
