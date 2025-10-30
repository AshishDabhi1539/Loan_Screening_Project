import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { NotificationService } from '../../../../core/services/notification.service';

// Employment & Financial Details Request Interface (matching backend)
export interface EmploymentFinancialRequest {
  // Employment Type
  employmentType: string;
  
  // Company/Business Details
  companyName: string;
  jobTitle: string;
  employmentStartDate: string;
  companyAddress: string;
  companyCity: string;
  companyState: string;
  companyPincode: string;
  
  // Contact Details
  workPhone?: string;
  workEmail?: string;
  hrPhone?: string;
  hrEmail?: string;
  managerName?: string;
  managerPhone?: string;
  
  // Income Details
  incomeType: string;
  monthlyIncome: number;
  additionalIncome: number;
  
  // Financial Profile
  existingLoanEmi: number;
  creditCardOutstanding: number;
  monthlyExpenses: number;
  bankAccountBalance: number;
  
  // Banking Details
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branchName: string;
}

@Component({
  selector: 'app-employment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './employment-details.component.html',
  styleUrl: './employment-details.component.css'
})
export class EmploymentDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loanApplicationService = inject(LoanApplicationService);
  private notificationService = inject(NotificationService);

  employmentForm!: FormGroup;
  isLoading = signal(false);
  currentStep = signal(1);
  totalSteps = 5;

  // Application context
  applicationId = signal<string | null>(null);
  loanType = signal<string | null>(null);
  loanAmount = signal<number>(0);
  selectedEmploymentType = signal<string | null>(null);

  // Employment types (3 main types covering 95% of users)
  employmentTypes = [
    { 
      value: 'SALARIED', 
      label: 'Salaried Employee', 
      icon: '💼',
      description: 'Working for a company or organization',
      minIncome: 25000,
      recommended: true
    },
    { 
      value: 'SELF_EMPLOYED', 
      label: 'Self Employed', 
      icon: '📊',
      description: 'Running own practice or consultancy',
      minIncome: 30000,
      recommended: true
    },
    { 
      value: 'BUSINESS_OWNER', 
      label: 'Business Owner', 
      icon: '🏢',
      description: 'Registered company or firm owner',
      minIncome: 50000,
      recommended: true
    }
  ];

  // Income types
  incomeTypes = [
    { value: 'SALARY', label: 'Salary Income' },
    { value: 'BUSINESS', label: 'Business Income' },
    { value: 'FREELANCE', label: 'Freelance Income' },
    { value: 'OTHER', label: 'Other Sources' }
  ];

  // Account types
  accountTypes = [
    { value: 'SAVINGS', label: 'Savings Account' },
    { value: 'CURRENT', label: 'Current Account' },
    { value: 'SALARY', label: 'Salary Account' }
  ];

  // Indian states
  states = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry'
  ];

  ngOnInit(): void {
    // Get application ID from route
    this.route.queryParams.subscribe(params => {
      const appId = params['applicationId'];
      if (appId) {
        this.applicationId.set(appId);
        this.loadApplicationDetails(appId);
      } else {
        this.notificationService.error('Error', 'Application ID not found');
        this.router.navigate(['/applicant/dashboard']);
      }
    });

    this.initializeForm();
  }

  /**
   * Load application details
   */
  private loadApplicationDetails(applicationId: string): void {
    this.loanApplicationService.getApplicationById(applicationId).subscribe({
      next: (application) => {
        this.loanType.set(application.loanType);
        this.loanAmount.set(application.requestedAmount);
      },
      error: (error) => {
        console.error('Failed to load application:', error);
        this.notificationService.error('Error', 'Failed to load application details');
      }
    });
  }

  /**
   * Initialize form
   */
  private initializeForm(): void {
    this.employmentForm = this.fb.group({
      // Step 1: Employment Type
      employmentType: ['', Validators.required],
      
      // Step 2: Employment Details
      companyName: [''],
      jobTitle: [''],
      employmentStartDate: [''],
      companyAddress: [''],
      companyCity: [''],
      companyState: [''],
      companyPincode: [''],
      workPhone: [''],
      workEmail: [''],
      hrPhone: [''],
      hrEmail: [''],
      managerName: [''],
      managerPhone: [''],
      
      // Step 3: Income Details
      incomeType: ['', Validators.required],
      monthlyIncome: ['', [Validators.required, Validators.min(10000)]],
      additionalIncome: [0],
      
      // Step 4: Banking Details
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      accountType: ['', Validators.required],
      branchName: ['', Validators.required],
      bankAccountBalance: ['', [Validators.required, Validators.min(0)]],
      
      // Step 5: Financial Obligations
      monthlyExpenses: ['', [Validators.required, Validators.min(0)]],
      existingLoanEmi: [0],
      creditCardOutstanding: [0]
    });

    // Listen for employment type changes
    this.employmentForm.get('employmentType')?.valueChanges.subscribe((type) => {
      this.selectedEmploymentType.set(type);
      this.updateValidators(type);
    });
  }

  /**
   * Update validators based on employment type
   */
  private updateValidators(employmentType: string): void {
    // Clear validators first
    this.clearValidators();

    // Common required fields for all types
    const commonFields = ['companyName', 'jobTitle', 'employmentStartDate', 'companyAddress', 'companyCity', 'companyState', 'companyPincode'];
    
    commonFields.forEach(field => {
      this.employmentForm.get(field)?.setValidators([Validators.required]);
      this.employmentForm.get(field)?.updateValueAndValidity();
    });

    // Employment type specific validators
    if (employmentType === 'SALARIED') {
      this.employmentForm.get('workPhone')?.setValidators([Validators.pattern(/^[0-9]{10}$/)]);
      this.employmentForm.get('workEmail')?.setValidators([Validators.email]);
      this.employmentForm.get('incomeType')?.setValue('SALARY');
      // Don't disable - will use readonly in HTML
      
      // Update validators
      this.employmentForm.get('workPhone')?.updateValueAndValidity();
      this.employmentForm.get('workEmail')?.updateValueAndValidity();
    } else if (employmentType === 'SELF_EMPLOYED' || employmentType === 'BUSINESS_OWNER') {
      // For business types, workPhone is optional but if filled must be valid
      this.employmentForm.get('workPhone')?.setValidators([Validators.pattern(/^[0-9]{10}$/)]);
      this.employmentForm.get('workEmail')?.setValidators([Validators.email]);
      this.employmentForm.get('incomeType')?.setValue('BUSINESS');
      // Don't disable - will use readonly in HTML
      
      // Update validators
      this.employmentForm.get('workPhone')?.updateValueAndValidity();
      this.employmentForm.get('workEmail')?.updateValueAndValidity();
    }
  }

  /**
   * Clear all conditional validators
   */
  private clearValidators(): void {
    const conditionalFields = ['workPhone', 'workEmail', 'hrPhone', 'hrEmail', 'managerName', 'managerPhone'];
    conditionalFields.forEach(field => {
      const control = this.employmentForm.get(field);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  }

  /**
   * Check if income type should be readonly
   */
  isIncomeTypeReadonly(): boolean {
    const employmentType = this.employmentForm.get('employmentType')?.value;
    return employmentType === 'SALARIED' || employmentType === 'SELF_EMPLOYED' || employmentType === 'BUSINESS_OWNER';
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
      window.scrollTo(0, 0);
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      window.scrollTo(0, 0);
    }
  }

  /**
   * Check if current step is valid
   */
  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return !!this.employmentForm.get('employmentType')?.valid;
      case 2:
        return !!( 
          this.employmentForm.get('companyName')?.valid &&
          this.employmentForm.get('jobTitle')?.valid &&
          this.employmentForm.get('employmentStartDate')?.valid &&
          this.employmentForm.get('companyAddress')?.valid
        );
      case 3:
        return !!this.employmentForm.get('monthlyIncome')?.valid;
      case 4:
        return !!( 
          this.employmentForm.get('bankName')?.valid &&
          this.employmentForm.get('accountNumber')?.valid &&
          this.employmentForm.get('ifscCode')?.valid
        );
      case 5:
        return !!this.employmentForm.get('monthlyExpenses')?.valid;
      default:
        return false;
    }
  }

  /**
   * Calculate total monthly income
   */
  getTotalIncome(): number {
    const monthly = this.employmentForm.get('monthlyIncome')?.value || 0;
    const additional = this.employmentForm.get('additionalIncome')?.value || 0;
    return monthly + additional;
  }

  /**
   * Calculate total obligations
   */
  getTotalObligations(): number {
    const expenses = this.employmentForm.get('monthlyExpenses')?.value || 0;
    const emi = this.employmentForm.get('existingLoanEmi')?.value || 0;
    return expenses + emi;
  }

  /**
   * Calculate disposable income
   */
  getDisposableIncome(): number {
    return this.getTotalIncome() - this.getTotalObligations();
  }

  /**
   * Calculate FOIR (Fixed Obligation to Income Ratio)
   */
  getFOIR(): number {
    const totalIncome = this.getTotalIncome();
    if (totalIncome === 0) return 0;
    return Math.round((this.getTotalObligations() / totalIncome) * 100);
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.employmentForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['email']) return 'Invalid email format';
      if (control.errors['pattern']) {
        if (fieldName.includes('Phone')) return 'Enter valid 10-digit phone number';
        if (fieldName === 'companyPincode') return 'Enter valid 6-digit PIN code';
        if (fieldName === 'ifscCode') return 'Invalid IFSC code format (e.g., HDFC0001234)';
      }
      if (control.errors['min']) return `Minimum value is ₹${control.errors['min'].min.toLocaleString('en-IN')}`;
    }
    return '';
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN');
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
  }

  /**
   * Submit form
   */
  onSubmit(): void {
    if (this.employmentForm.invalid) {
      this.markFormGroupTouched(this.employmentForm);
      this.notificationService.warning('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formData = this.employmentForm.getRawValue();

    // Prepare request matching backend DTO
    const request: any = {
      employmentType: formData.employmentType,
      companyName: formData.companyName,
      jobTitle: formData.jobTitle,
      employmentStartDate: formData.employmentStartDate,
      companyAddress: formData.companyAddress,
      companyCity: formData.companyCity,
      companyState: formData.companyState,
      companyPincode: formData.companyPincode,
      workPhone: formData.workPhone,
      workEmail: formData.workEmail,
      hrPhone: formData.hrPhone,
      hrEmail: formData.hrEmail,
      managerName: formData.managerName,
      managerPhone: formData.managerPhone,
      incomeType: formData.incomeType,
      monthlyIncome: formData.monthlyIncome,
      additionalIncome: formData.additionalIncome,
      existingLoanEmi: formData.existingLoanEmi,
      creditCardOutstanding: formData.creditCardOutstanding,
      monthlyExpenses: formData.monthlyExpenses,
      bankAccountBalance: formData.bankAccountBalance,
      bankName: formData.bankName,
      accountNumber: formData.accountNumber,
      ifscCode: formData.ifscCode,
      accountType: formData.accountType,
      branchName: formData.branchName
    };

    const appId = this.applicationId();
    if (!appId) {
      this.notificationService.error('Error', 'Application ID not found');
      this.isLoading.set(false);
      return;
    }

    this.loanApplicationService.updateFinancialDetails(appId, request).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.notificationService.success('Success', 'Financial details saved successfully!');
        
        // Navigate to dashboard or documents upload
        this.router.navigate(['/applicant/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to save financial details:', error);
        
        let errorMessage = 'Failed to save details. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Mark form group as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  /**
   * Get current date for max date validation
   */
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
