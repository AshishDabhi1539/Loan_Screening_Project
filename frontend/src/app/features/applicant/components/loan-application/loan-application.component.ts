import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanApplicationService, LoanApplicationRequest } from '../../../../core/services/loan-application.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';

@Component({
  selector: 'app-loan-application',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './loan-application.component.html',
  styleUrl: './loan-application.component.css'
})
export class LoanApplicationComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private loanApplicationService = inject(LoanApplicationService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);

  loanApplicationForm!: FormGroup;
  isLoading = signal(false);
  isCheckingProfile = signal(true);
  currentStep = signal(1);
  totalSteps = 2;

  // EMI Calculation signals
  calculatedEMI = signal<number>(0);
  totalInterest = signal<number>(0);
  totalPayable = signal<number>(0);

  // Loan Types from backend (matching LoanType.java enum)
  loanTypes = [
    { value: 'PERSONAL_LOAN', label: 'Personal Loan', icon: '💰', interestRate: 10.5, description: 'Unsecured loan for personal needs' },
    { value: 'HOME_LOAN', label: 'Home Loan', icon: '🏠', interestRate: 8.5, description: 'Loan for purchasing or constructing home' },
    { value: 'CAR_LOAN', label: 'Car Loan', icon: '🚗', interestRate: 9.0, description: 'Loan for purchasing car' },
    { value: 'TWO_WHEELER_LOAN', label: 'Two Wheeler Loan', icon: '🏍️', interestRate: 11.0, description: 'Loan for purchasing two wheeler' },
    { value: 'EDUCATION_LOAN', label: 'Education Loan', icon: '🎓', interestRate: 7.5, description: 'Loan for education expenses' },
    { value: 'BUSINESS_LOAN', label: 'Business Loan', icon: '💼', interestRate: 12.0, description: 'Loan for business needs' },
    { value: 'GOLD_LOAN', label: 'Gold Loan', icon: '✨', interestRate: 7.0, description: 'Loan against gold' },
    { value: 'PROPERTY_LOAN', label: 'Property Loan', icon: '🏢', interestRate: 9.5, description: 'Loan for property purchase' }
  ];

  // Tenure options in months
  tenureOptions = [
    { months: 6, label: '6 Months' },
    { months: 12, label: '1 Year' },
    { months: 24, label: '2 Years' },
    { months: 36, label: '3 Years' },
    { months: 48, label: '4 Years' },
    { months: 60, label: '5 Years' },
    { months: 84, label: '7 Years' },
    { months: 120, label: '10 Years' },
    { months: 180, label: '15 Years' },
    { months: 240, label: '20 Years' },
    { months: 300, label: '25 Years' },
    { months: 360, label: '30 Years' }
  ];

  ngOnInit(): void {
    this.checkPersonalDetailsCompletion();
  }

  /**
   * Check if user has completed personal details before allowing loan application
   */
  private checkPersonalDetailsCompletion(): void {
    this.isCheckingProfile.set(true);
    
    this.userProfileService.hasPersonalDetails().subscribe({
      next: (hasDetails) => {
        this.isCheckingProfile.set(false);
        
        if (!hasDetails) {
          this.notificationService.warning(
            'Complete Your Profile First',
            'Please complete your personal details before applying for a loan.'
          );
          
          // Redirect to personal details page
          setTimeout(() => {
            this.router.navigate(['/applicant/personal-details']);
          }, 2000);
        } else {
          // Personal details exist, initialize form
          this.initializeForm();
          this.setupValueChangeListeners();
        }
      },
      error: (error) => {
        this.isCheckingProfile.set(false);
        console.error('Failed to check personal details status:', error);
        
        this.notificationService.error(
          'Error',
          'Failed to verify your profile. Please try again.'
        );
        
        // Navigate using the backend's nextStepUrl (proper workflow)
        if (error.nextStepUrl) {
          this.router.navigateByUrl(error.nextStepUrl);
        } else {
          // Fallback: go to dashboard if no URL provided
          this.router.navigate(['/applicant/dashboard']);
        }
      }
    });
  }

  /**
   * Initialize the loan application form
   */
  private initializeForm(): void {
    this.loanApplicationForm = this.fb.group({
      loanType: ['', Validators.required],
      loanAmount: ['', [Validators.required, Validators.min(10000), Validators.max(10000000)]],
      tenureMonths: ['', [Validators.required, Validators.min(6), Validators.max(360)]],
      purpose: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      additionalNotes: ['', Validators.maxLength(500)]
    });
  }

  /**
   * Setup listeners for real-time EMI calculation
   */
  private setupValueChangeListeners(): void {
    this.loanApplicationForm.valueChanges.subscribe(() => {
      this.calculateEMI();
    });
  }

  /**
   * Calculate EMI using reducing balance method
   */
  calculateEMI(): void {
    const loanTypeValue = this.loanApplicationForm.get('loanType')?.value;
    const loanAmount = this.loanApplicationForm.get('loanAmount')?.value;
    const tenure = this.loanApplicationForm.get('tenureMonths')?.value;

    if (!loanTypeValue || !loanAmount || !tenure) {
      this.calculatedEMI.set(0);
      this.totalInterest.set(0);
      this.totalPayable.set(0);
      return;
    }

    // Get interest rate for selected loan type
    const selectedLoanType = this.loanTypes.find(lt => lt.value === loanTypeValue);
    const annualInterestRate = selectedLoanType?.interestRate || 10.0;
    
    // Convert annual rate to monthly rate
    const monthlyRate = annualInterestRate / 12 / 100;
    
    // EMI Formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    
    const totalAmount = emi * tenure;
    const interest = totalAmount - loanAmount;

    this.calculatedEMI.set(Math.round(emi));
    this.totalInterest.set(Math.round(interest));
    this.totalPayable.set(Math.round(totalAmount));
  }

  /**
   * Get selected loan type details
   */
  getSelectedLoanType() {
    const loanTypeValue = this.loanApplicationForm.get('loanType')?.value;
    return this.loanTypes.find(lt => lt.value === loanTypeValue);
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  /**
   * Check if current step is valid
   */
  isStepValid(step: number): boolean {
    switch (step) {
      case 1: // Loan details
        return !!(
          this.loanApplicationForm.get('loanType')?.valid &&
          this.loanApplicationForm.get('loanAmount')?.valid &&
          this.loanApplicationForm.get('tenureMonths')?.valid
        );
      case 2: // Purpose
        return !!this.loanApplicationForm.get('purpose')?.valid;
      default:
        return false;
    }
  }

  /**
   * Submit the loan application
   */
  onSubmit(): void {
    if (this.loanApplicationForm.invalid) {
      this.markFormGroupTouched(this.loanApplicationForm);
      this.notificationService.warning('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formData = this.loanApplicationForm.value as LoanApplicationRequest;

    this.loanApplicationService.createApplication(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.notificationService.success('Success', response.message || 'Loan application created successfully!');
        
        // Navigate to the next step URL provided by backend
        if (response.nextStepUrl) {
          this.router.navigateByUrl(response.nextStepUrl);
        } else {
          // Default: navigate to employment details with application ID and loan type
          this.router.navigate(['/applicant/employment-details'], {
            queryParams: { 
              applicationId: response.id,
              loanType: formData.loanType  // Pass loan type for smart filtering
            }
          });
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to create loan application:', error);
        
        let errorMessage = 'Failed to create loan application. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.loanApplicationForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['min']) return `Minimum value is ₹${control.errors['min'].min.toLocaleString('en-IN')}`;
      if (control.errors['max']) return `Maximum value is ₹${control.errors['max'].max.toLocaleString('en-IN')}`;
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
    }
    return '';
  }

  /**
   * Cancel and go back to dashboard
   */
  cancel(): void {
    this.router.navigate(['/applicant/dashboard']);
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
}
