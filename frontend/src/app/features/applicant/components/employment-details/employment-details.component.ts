import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanApplicationService } from '../../../../core/services/loan-application.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoanEligibilityService } from '../../../../core/services/loan-eligibility.service';
import { EmploymentTypeEligibility } from '../../../../core/models/eligibility.model';

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
  
  // Employment Type Specific Details
  professionalDetails?: ProfessionalEmploymentDetails;
  freelancerDetails?: FreelancerEmploymentDetails;
  retiredDetails?: RetiredEmploymentDetails;
  studentDetails?: StudentEmploymentDetails;
}

// Professional Employment Details Interface
export interface ProfessionalEmploymentDetails {
  professionType: string;
  registrationNumber: string;
  registrationAuthority: string;
  professionalQualification: string;
  university?: string;
  yearOfQualification?: number;
  practiceArea?: string;
  clinicOrFirmName?: string;
  clinicOrFirmAddress?: string;
  additionalCertifications?: string;
}

// Freelancer Employment Details Interface
export interface FreelancerEmploymentDetails {
  freelanceType: string;
  freelanceSince: string;
  primaryClients?: string;
  averageMonthlyIncome: number;
  portfolioUrl?: string;
  freelancePlatform?: string;
  skillSet?: string;
  projectTypes?: string;
  activeClientsCount?: number;
  paymentMethods?: string;
}

// Retired Employment Details Interface
export interface RetiredEmploymentDetails {
  pensionType: string;
  pensionProvider: string;
  ppoNumber?: string;
  monthlyPensionAmount: number;
  retirementDate: string;
  previousEmployer?: string;
  previousDesignation?: string;
  yearsOfService?: number;
  pensionAccountNumber?: string;
  pensionBankName?: string;
  additionalRetirementBenefits?: string;
  gratuityAmount?: number;
}

// Student Employment Details Interface
export interface StudentEmploymentDetails {
  // Education Details
  institutionName: string;
  institutionAddress: string;
  institutionCity: string;
  institutionState: string;
  courseName: string;
  specialization?: string;
  yearOfStudy: number;
  totalCourseDuration: number;
  expectedGraduationYear: number;
  studentIdNumber: string;
  currentCGPA?: number;
  
  // Guardian Details
  guardianName: string;
  guardianRelation: string;
  guardianOccupation: string;
  guardianEmployer?: string;
  guardianDesignation?: string;
  guardianMonthlyIncome: number;
  guardianAnnualIncome: number;
  guardianContact: string;
  guardianEmail?: string;
  guardianAddress: string;
  guardianCity: string;
  guardianState: string;
  guardianPincode: string;
  guardianPanNumber?: string;
  guardianAadharNumber?: string;
  
  // Financial Support
  scholarshipAmount?: number;
  scholarshipProvider?: string;
  familySavingsForEducation?: number;
  additionalFinancialSupport?: string;
}

import { FoirCalculatorComponent } from '../../../../shared/components/foir-calculator/foir-calculator.component';

@Component({
  selector: 'app-employment-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FoirCalculatorComponent],
  templateUrl: './employment-details.component.html',
  styleUrl: './employment-details.component.css'
})
export class EmploymentDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private loanApplicationService = inject(LoanApplicationService);
  private notificationService = inject(NotificationService);
  private eligibilityService = inject(LoanEligibilityService);

  employmentForm!: FormGroup;
  isLoading = signal(false);
  currentStep = signal(1);
  totalSteps = 5;

  // Application context
  applicationId = signal<string | null>(null);
  loanType = signal<string | null>(null);
  loanAmount = signal<number>(0);
  selectedEmploymentType = signal<string | null>(null);
  returnUrl = signal<string>(''); // URL to return to after completion
  
  // Employment type eligibility from backend
  employmentEligibility = signal<EmploymentTypeEligibility[]>([]);
  isLoadingEligibility = signal(false);
  minimumIncome = signal<number>(25000);

  // All employment types with display metadata
  allEmploymentTypes = [
    { value: 'SALARIED', label: 'Salaried Employee', icon: '💼', description: 'Working for a company or organization' },
    { value: 'SELF_EMPLOYED', label: 'Self Employed', icon: '📊', description: 'Running own practice or consultancy' },
    { value: 'BUSINESS_OWNER', label: 'Business Owner', icon: '🏢', description: 'Registered company or firm owner' },
    { value: 'PROFESSIONAL', label: 'Professional', icon: '⚕️', description: 'Doctor, Lawyer, CA, Architect' },
    { value: 'FREELANCER', label: 'Freelancer', icon: '💻', description: 'Independent contractor or consultant' },
    { value: 'RETIRED', label: 'Retired', icon: '🏖️', description: 'Receiving pension or retirement income' },
    { value: 'STUDENT', label: 'Student', icon: '🎓', description: 'Currently pursuing education' },
    { value: 'UNEMPLOYED', label: 'Unemployed', icon: '⚠️', description: 'Not currently employed' }
  ];
  
  // Computed: Show ONLY eligible employment types
  employmentTypes = computed(() => {
    const eligibility = this.employmentEligibility();
    console.log('Computing employment types. Eligibility data:', eligibility);
    
    // If eligibility data is not loaded yet, show all types with loading state
    if (eligibility.length === 0) {
      return this.allEmploymentTypes.map(empType => ({
        ...empType,
        eligible: false,
        reason: 'Loading...',
        minimumDurationMonths: undefined
      }));
    }
    
    // Filter and show ONLY eligible types
    return this.allEmploymentTypes
      .map(empType => {
        const eligibilityInfo = eligibility.find(e => e.employmentType === empType.value);
        return {
          ...empType,
          eligible: eligibilityInfo?.eligible ?? false,
          reason: eligibilityInfo?.reason ?? 'Not eligible for this loan type',
          minimumDurationMonths: eligibilityInfo?.minimumDurationMonths
        };
      })
      .filter(empType => empType.eligible); // ✨ Show only eligible types
  });

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
    // Get application ID, loan type, and returnUrl from route
    this.route.queryParams.subscribe(params => {
      console.log('🔍 Query params received:', params);
      const appId = params['applicationId'];
      const loanTypeParam = params['loanType'];
      const returnUrl = params['returnUrl'];
      
      console.log('📋 Application ID:', appId);
      console.log('💼 Loan Type from params:', loanTypeParam);
      console.log('🔙 Return URL from params:', returnUrl);
      
      // Set returnUrl if provided
      if (returnUrl) {
        this.returnUrl.set(returnUrl);
        console.log('✅ Return URL set:', returnUrl);
      }
      
      if (appId) {
        this.applicationId.set(appId);
        
        if (loanTypeParam) {
          console.log('✅ Loan type found, loading eligibility for:', loanTypeParam);
          this.loanType.set(loanTypeParam);
          this.loadEmploymentEligibility(loanTypeParam);
        } else {
          console.warn('⚠️ No loanType in query params');
        }
        
        this.loadApplicationDetails(appId);
      } else {
        this.notificationService.error('Error', 'Application ID not found');
        this.router.navigate(['/applicant/dashboard']);
      }
    });

    this.initializeForm();
  }

  /**
   * Load employment eligibility based on loan type
   */
  private loadEmploymentEligibility(loanType: string): void {
    console.log('🚀 loadEmploymentEligibility called with loanType:', loanType);
    this.isLoadingEligibility.set(true);
    
    console.log('📡 Making API call to fetch eligibility...');
    this.eligibilityService.getEligibleEmploymentTypes(loanType).subscribe({
      next: (response) => {
        console.log('Raw API response:', response);
        console.log('Employment types from response:', response.employmentTypes);
        
        this.employmentEligibility.set(response.employmentTypes);
        this.minimumIncome.set(response.minimumIncome);
        this.isLoadingEligibility.set(false);
        
        console.log('Signal value after set:', this.employmentEligibility());
        console.log('Minimum income:', response.minimumIncome);
      },
      error: (error) => {
        console.error('Failed to load employment eligibility:', error);
        this.isLoadingEligibility.set(false);
        // Don't show error to user, fall back to showing all types
        this.notificationService.warning('Note', 'Could not load employment type filters. Showing all options.');
      }
    });
  }

  /**
   * Load application details
   */
  private loadApplicationDetails(applicationId: string): void {
    console.log('📡 Loading application details for ID:', applicationId);
    
    this.loanApplicationService.getApplicationById(applicationId).subscribe({
      next: (application) => {
        console.log('✅ Application loaded:', application);
        const appLoanType = application.loanType;
        console.log('💼 Loan type from application:', appLoanType);
        
        this.loanType.set(appLoanType);
        this.loanAmount.set(application.requestedAmount);
        
        // Always load eligibility when we get the loan type from backend
        if (appLoanType) {
          console.log('🚀 Loading eligibility for loan type:', appLoanType);
          this.loadEmploymentEligibility(appLoanType);
        }
      },
      error: (error) => {
        console.error('❌ Failed to load application:', error);
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
      creditCardOutstanding: [0],
      
      // PROFESSIONAL specific fields
      professionType: [''],
      registrationNumber: [''],
      registrationAuthority: [''],
      professionalQualification: [''],
      university: [''],
      yearOfQualification: [''],
      practiceArea: [''],
      clinicOrFirmName: [''],
      clinicOrFirmAddress: [''],
      additionalCertifications: [''],
      
      // FREELANCER specific fields
      freelanceType: [''],
      freelanceSince: [''],
      primaryClients: [''],
      averageMonthlyIncome: [''],
      portfolioUrl: [''],
      freelancePlatform: [''],
      skillSet: [''],
      projectTypes: [''],
      activeClientsCount: [''],
      paymentMethods: [''],
      
      // RETIRED specific fields
      pensionType: [''],
      pensionProvider: [''],
      ppoNumber: [''],
      monthlyPensionAmount: [''],
      retirementDate: [''],
      previousEmployer: [''],
      previousDesignation: [''],
      yearsOfService: [''],
      pensionAccountNumber: [''],
      pensionBankName: [''],
      additionalRetirementBenefits: [''],
      gratuityAmount: [''],
      
      // STUDENT specific fields
      institutionName: [''],
      courseName: [''],
      specialization: [''],
      yearOfStudy: [''],
      totalCourseDuration: [''],
      expectedGraduationYear: [''],
      guardianName: [''],
      guardianRelation: [''],
      guardianOccupation: [''],
      guardianEmployer: [''],
      guardianMonthlyIncome: [''],
      guardianContact: [''],
      guardianEmail: [''],
      guardianPanNumber: [''],
      
      // UNEMPLOYED specific fields
      unemploymentReason: [''],
      lastEmploymentDate: [''],
      currentIncomeSource: [''],
      assetsOwned: ['']
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

    // Common required fields ONLY for employment types that have companies
    // NOT for STUDENT, RETIRED, UNEMPLOYED, FREELANCER
    const needsCompanyDetails = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'PROFESSIONAL'];
    
    if (needsCompanyDetails.includes(employmentType)) {
      const commonFields = ['companyName', 'jobTitle', 'employmentStartDate', 'companyAddress', 'companyCity', 'companyState', 'companyPincode'];
      commonFields.forEach(field => {
        this.employmentForm.get(field)?.setValidators([Validators.required]);
        this.employmentForm.get(field)?.updateValueAndValidity();
      });
    } else {
      // Clear company fields for types that don't need them
      const companyFields = ['companyName', 'jobTitle', 'employmentStartDate', 'companyAddress', 'companyCity', 'companyState', 'companyPincode', 'workPhone', 'workEmail', 'hrPhone', 'hrEmail', 'managerName', 'managerPhone'];
      companyFields.forEach(field => {
        this.employmentForm.get(field)?.clearValidators();
        this.employmentForm.get(field)?.updateValueAndValidity();
      });
    }

    // Employment type specific validators
    switch (employmentType) {
      case 'SALARIED':
        this.employmentForm.get('workPhone')?.setValidators([Validators.pattern(/^[0-9]{10}$/)]);
        this.employmentForm.get('workEmail')?.setValidators([Validators.email]);
        this.employmentForm.get('incomeType')?.setValue('SALARY');
        this.employmentForm.get('workPhone')?.updateValueAndValidity();
        this.employmentForm.get('workEmail')?.updateValueAndValidity();
        break;
        
      case 'SELF_EMPLOYED':
      case 'BUSINESS_OWNER':
        this.employmentForm.get('workPhone')?.setValidators([Validators.pattern(/^[0-9]{10}$/)]);
        this.employmentForm.get('workEmail')?.setValidators([Validators.email]);
        this.employmentForm.get('incomeType')?.setValue('BUSINESS');
        this.employmentForm.get('workPhone')?.updateValueAndValidity();
        this.employmentForm.get('workEmail')?.updateValueAndValidity();
        break;
        
      case 'PROFESSIONAL':
        // Professional specific required fields
        this.employmentForm.get('professionType')?.setValidators([Validators.required]);
        this.employmentForm.get('registrationNumber')?.setValidators([Validators.required]);
        this.employmentForm.get('registrationAuthority')?.setValidators([Validators.required]);
        this.employmentForm.get('professionalQualification')?.setValidators([Validators.required]);
        this.employmentForm.get('incomeType')?.setValue('BUSINESS');
        
        this.employmentForm.get('professionType')?.updateValueAndValidity();
        this.employmentForm.get('registrationNumber')?.updateValueAndValidity();
        this.employmentForm.get('registrationAuthority')?.updateValueAndValidity();
        this.employmentForm.get('professionalQualification')?.updateValueAndValidity();
        break;
        
      case 'FREELANCER':
        // Freelancer specific required fields
        this.employmentForm.get('freelanceType')?.setValidators([Validators.required]);
        this.employmentForm.get('freelanceSince')?.setValidators([Validators.required]);
        this.employmentForm.get('primaryClients')?.setValidators([Validators.required]);
        this.employmentForm.get('incomeType')?.setValue('FREELANCE');
        
        this.employmentForm.get('freelanceType')?.updateValueAndValidity();
        this.employmentForm.get('freelanceSince')?.updateValueAndValidity();
        this.employmentForm.get('primaryClients')?.updateValueAndValidity();
        break;
        
      case 'RETIRED':
        // Retired specific required fields
        this.employmentForm.get('pensionType')?.setValidators([Validators.required]);
        this.employmentForm.get('pensionProvider')?.setValidators([Validators.required]);
        this.employmentForm.get('monthlyPensionAmount')?.setValidators([Validators.required, Validators.min(0)]);
        this.employmentForm.get('retirementDate')?.setValidators([Validators.required]);
        this.employmentForm.get('previousEmployer')?.setValidators([Validators.required]);
        this.employmentForm.get('previousDesignation')?.setValidators([Validators.required]);
        this.employmentForm.get('incomeType')?.setValue('OTHER');
        
        this.employmentForm.get('pensionType')?.updateValueAndValidity();
        this.employmentForm.get('pensionProvider')?.updateValueAndValidity();
        this.employmentForm.get('monthlyPensionAmount')?.updateValueAndValidity();
        this.employmentForm.get('retirementDate')?.updateValueAndValidity();
        this.employmentForm.get('previousEmployer')?.updateValueAndValidity();
        this.employmentForm.get('previousDesignation')?.updateValueAndValidity();
        break;
        
      case 'STUDENT':
        // Student specific required fields
        this.employmentForm.get('institutionName')?.setValidators([Validators.required]);
        this.employmentForm.get('courseName')?.setValidators([Validators.required]);
        this.employmentForm.get('yearOfStudy')?.setValidators([Validators.required]);
        this.employmentForm.get('totalCourseDuration')?.setValidators([Validators.required]);
        this.employmentForm.get('expectedGraduationYear')?.setValidators([Validators.required, Validators.min(2024), Validators.max(2035)]);
        this.employmentForm.get('guardianName')?.setValidators([Validators.required]);
        this.employmentForm.get('guardianRelation')?.setValidators([Validators.required]);
        this.employmentForm.get('guardianOccupation')?.setValidators([Validators.required]);
        this.employmentForm.get('guardianEmployer')?.setValidators([Validators.required]);
        this.employmentForm.get('guardianMonthlyIncome')?.setValidators([Validators.required, Validators.min(30000)]);
        this.employmentForm.get('guardianContact')?.setValidators([Validators.required, Validators.pattern(/^[0-9]{10}$/)]);
        this.employmentForm.get('incomeType')?.setValue('OTHER');
        
        this.employmentForm.get('institutionName')?.updateValueAndValidity();
        this.employmentForm.get('courseName')?.updateValueAndValidity();
        this.employmentForm.get('yearOfStudy')?.updateValueAndValidity();
        this.employmentForm.get('totalCourseDuration')?.updateValueAndValidity();
        this.employmentForm.get('expectedGraduationYear')?.updateValueAndValidity();
        this.employmentForm.get('guardianName')?.updateValueAndValidity();
        this.employmentForm.get('guardianRelation')?.updateValueAndValidity();
        this.employmentForm.get('guardianOccupation')?.updateValueAndValidity();
        this.employmentForm.get('guardianEmployer')?.updateValueAndValidity();
        this.employmentForm.get('guardianMonthlyIncome')?.updateValueAndValidity();
        this.employmentForm.get('guardianContact')?.updateValueAndValidity();
        break;
        
      case 'UNEMPLOYED':
        // Unemployed specific required fields
        this.employmentForm.get('unemploymentReason')?.setValidators([Validators.required]);
        this.employmentForm.get('currentIncomeSource')?.setValidators([Validators.required]);
        this.employmentForm.get('incomeType')?.setValue('OTHER');
        // Allow zero income for unemployed
        this.employmentForm.get('monthlyIncome')?.setValidators([Validators.required, Validators.min(0)]);
        
        this.employmentForm.get('unemploymentReason')?.updateValueAndValidity();
        this.employmentForm.get('currentIncomeSource')?.updateValueAndValidity();
        this.employmentForm.get('monthlyIncome')?.updateValueAndValidity();
        break;
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
   * Select employment type and move to next step
   */
  selectEmploymentType(type: string): void {
    console.log('Selected employment type:', type);
    this.selectedEmploymentType.set(type);
    this.employmentForm.patchValue({ employmentType: type });
    this.updateValidators(type);
    
    // Move to next step
    this.nextStep();
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    const employmentType = this.selectedEmploymentType();
    
    // Auto-populate income for specific employment types before moving to step 3
    if (this.currentStep() === 2 && employmentType) {
      this.autoPopulateIncomeFromEmploymentData(employmentType);
    }
    
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
      window.scrollTo(0, 0);
    }
  }

  /**
   * Auto-populate income based on employment type data already collected
   */
  private autoPopulateIncomeFromEmploymentData(employmentType: string): void {
    switch (employmentType) {
      case 'STUDENT':
        // Use guardian's income for student loans
        const guardianIncome = this.employmentForm.get('guardianMonthlyIncome')?.value;
        if (guardianIncome) {
          this.employmentForm.patchValue({
            monthlyIncome: guardianIncome,
            incomeType: 'OTHER'
          });
        }
        break;
        
      case 'RETIRED':
        // Use pension amount as monthly income
        const pensionAmount = this.employmentForm.get('monthlyPensionAmount')?.value;
        if (pensionAmount) {
          this.employmentForm.patchValue({
            monthlyIncome: pensionAmount,
            incomeType: 'OTHER'
          });
        }
        break;
        
      case 'FREELANCER':
        // Use average monthly income already provided
        const avgIncome = this.employmentForm.get('averageMonthlyIncome')?.value;
        if (avgIncome) {
          this.employmentForm.patchValue({
            monthlyIncome: avgIncome,
            incomeType: 'FREELANCE'
          });
        }
        break;
        
      case 'UNEMPLOYED':
        // Set minimum income with warning
        this.employmentForm.patchValue({
          monthlyIncome: 0,
          incomeType: 'OTHER'
        });
        break;
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
    const employmentType = this.employmentForm.get('employmentType')?.value;
    
    switch (step) {
      case 1:
        return !!this.employmentForm.get('employmentType')?.valid;
      case 2:
        // Different validation based on employment type
        if (employmentType === 'STUDENT') {
          return !!(
            this.employmentForm.get('institutionName')?.valid &&
            this.employmentForm.get('courseName')?.valid &&
            this.employmentForm.get('yearOfStudy')?.valid
          );
        } else if (employmentType === 'RETIRED') {
          return !!(
            this.employmentForm.get('pensionType')?.valid &&
            this.employmentForm.get('pensionProvider')?.valid &&
            this.employmentForm.get('monthlyPensionAmount')?.valid
          );
        } else if (employmentType === 'UNEMPLOYED') {
          return !!(
            this.employmentForm.get('unemploymentReason')?.valid &&
            this.employmentForm.get('currentIncomeSource')?.valid
          );
        } else if (employmentType === 'FREELANCER') {
          return !!(
            this.employmentForm.get('freelanceType')?.valid &&
            this.employmentForm.get('freelanceSince')?.valid &&
            this.employmentForm.get('primaryClients')?.valid
          );
        } else {
          // For SALARIED, SELF_EMPLOYED, BUSINESS_OWNER, PROFESSIONAL
          return !!( 
            this.employmentForm.get('companyName')?.valid &&
            this.employmentForm.get('jobTitle')?.valid &&
            this.employmentForm.get('employmentStartDate')?.valid &&
            this.employmentForm.get('companyAddress')?.valid
          );
        }
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
   * Calculate estimated EMI based on loan amount
   * Simple formula: (P x R x (1+R)^N) / ((1+R)^N - 1)
   */
  calculateEstimatedEMI(): number {
    const loanAmount = this.loanAmount();
    if (!loanAmount || loanAmount <= 0) {
      return 0;
    }
    
    // Assume 12% annual interest and 36 months (3 years) tenure as default
    const monthlyRate = 0.12 / 12; // 1% per month
    const tenure = 36; // months
    
    const emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenure)) / 
                (Math.pow(1 + monthlyRate, tenure) - 1);
    
    return Math.round(emi);
  }

  /**
   * Get progress percentage based on COMPLETED steps
   * When on step 2, only step 1 is completed = 20%
   * When on step 3, steps 1 & 2 are completed = 40%
   */
  getProgressPercentage(): number {
    const completedSteps = this.currentStep() - 1;
    return Math.round((completedSteps / this.totalSteps) * 100);
  }
  
  /**
   * Get current year for max date validation
   */
  getCurrentYear(): number {
    return new Date().getFullYear();
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

    // Add company details only for relevant employment types
    const needsCompanyDetails = ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'PROFESSIONAL'];
    if (needsCompanyDetails.includes(formData.employmentType)) {
      request.companyName = formData.companyName;
      request.jobTitle = formData.jobTitle;
      request.employmentStartDate = formData.employmentStartDate;
      request.companyAddress = formData.companyAddress;
      request.companyCity = formData.companyCity;
      request.companyState = formData.companyState;
      request.companyPincode = formData.companyPincode;
      request.workPhone = formData.workPhone;
      request.workEmail = formData.workEmail;
      request.hrPhone = formData.hrPhone;
      request.hrEmail = formData.hrEmail;
      request.managerName = formData.managerName;
      request.managerPhone = formData.managerPhone;
    }

    // Add specialized employment details based on employment type
    this.addSpecializedEmploymentDetails(request, formData);

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
        
        // Check if we have a return URL (coming from summary page)
        const returnUrl = this.returnUrl();
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          // Normal flow - Navigate to document upload with application ID and employment type
          this.router.navigate(['/applicant/document-upload'], {
            queryParams: {
              applicationId: appId,
              employmentType: formData.employmentType
            }
          });
        }
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
   * Cancel and go back to dashboard or return URL
   */
  cancel(): void {
    const returnUrl = this.returnUrl();
    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/applicant/dashboard']);
    }
  }

  /**
   * Get current date for max date validation
   */
  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Check if current employment type needs company details
   */
  needsCompanyDetails(): boolean {
    const employmentType = this.selectedEmploymentType();
    return ['SALARIED', 'SELF_EMPLOYED', 'BUSINESS_OWNER', 'PROFESSIONAL'].includes(employmentType || '');
  }

  /**
   * Check if income is auto-populated from employment data
   */
  isIncomeAutoPopulated(): boolean {
    const employmentType = this.selectedEmploymentType();
    return ['STUDENT', 'RETIRED', 'FREELANCER'].includes(employmentType || '');
  }

  /**
   * Get income source label based on employment type
   */
  getIncomeSourceLabel(): string {
    const employmentType = this.selectedEmploymentType();
    switch (employmentType) {
      case 'STUDENT':
        return "Guardian's Monthly Income";
      case 'RETIRED':
        return 'Monthly Pension Amount';
      case 'FREELANCER':
        return 'Average Monthly Income';
      case 'UNEMPLOYED':
        return 'Monthly Income (if any)';
      default:
        return 'Monthly Income';
    }
  }

  /**
   * Show income help text based on employment type
   */
  getIncomeHelpText(): string {
    const employmentType = this.selectedEmploymentType();
    switch (employmentType) {
      case 'STUDENT':
        return 'Auto-populated from guardian income provided in Step 2';
      case 'RETIRED':
        return 'Auto-populated from pension amount provided in Step 2';
      case 'FREELANCER':
        return 'Auto-populated from average income provided in Step 2';
      case 'UNEMPLOYED':
        return 'Enter any income from family support, savings, or investments';
      default:
        return 'Minimum: ₹10,000';
    }
  }

  /**
   * Add specialized employment details based on employment type
   */
  private addSpecializedEmploymentDetails(request: any, formData: any): void {
    switch (formData.employmentType) {
      case 'PROFESSIONAL':
        // Collect real professional details from form
        request.professionalDetails = {
          professionType: formData.professionType,
          registrationNumber: formData.registrationNumber,
          registrationAuthority: formData.registrationAuthority,
          professionalQualification: formData.professionalQualification,
          university: formData.university,
          yearOfQualification: formData.yearOfQualification ? parseInt(formData.yearOfQualification) : undefined,
          practiceArea: formData.practiceArea,
          clinicOrFirmName: formData.clinicOrFirmName,
          clinicOrFirmAddress: formData.clinicOrFirmAddress,
          additionalCertifications: formData.additionalCertifications
        };
        break;
        
      case 'FREELANCER':
        // Collect real freelancer details from form
        request.freelancerDetails = {
          freelanceType: formData.freelanceType,
          freelanceSince: formData.freelanceSince,
          primaryClients: formData.primaryClients,
          averageMonthlyIncome: formData.averageMonthlyIncome || formData.monthlyIncome,
          portfolioUrl: formData.portfolioUrl,
          freelancePlatform: formData.freelancePlatform,
          skillSet: formData.skillSet,
          projectTypes: formData.projectTypes,
          activeClientsCount: formData.activeClientsCount ? parseInt(formData.activeClientsCount) : undefined,
          paymentMethods: formData.paymentMethods
        };
        break;
        
      case 'RETIRED':
        // Collect real retired details from form
        request.retiredDetails = {
          pensionType: formData.pensionType,
          pensionProvider: formData.pensionProvider,
          ppoNumber: formData.ppoNumber,
          monthlyPensionAmount: formData.monthlyPensionAmount || formData.monthlyIncome,
          retirementDate: formData.retirementDate,
          previousEmployer: formData.previousEmployer,
          previousDesignation: formData.previousDesignation,
          yearsOfService: formData.yearsOfService ? parseInt(formData.yearsOfService) : undefined,
          pensionAccountNumber: formData.pensionAccountNumber,
          pensionBankName: formData.pensionBankName,
          additionalRetirementBenefits: formData.additionalRetirementBenefits,
          gratuityAmount: formData.gratuityAmount ? parseFloat(formData.gratuityAmount) : undefined
        };
        break;
        
      case 'STUDENT':
        // Collect real student details from form
        request.studentDetails = {
          // Education Details
          institutionName: formData.institutionName,
          institutionAddress: formData.institutionAddress,
          institutionCity: formData.institutionCity,
          institutionState: formData.institutionState,
          courseName: formData.courseName,
          specialization: formData.specialization,
          yearOfStudy: formData.yearOfStudy ? parseInt(formData.yearOfStudy) : 1,
          totalCourseDuration: formData.totalCourseDuration ? parseInt(formData.totalCourseDuration) : 4,
          expectedGraduationYear: formData.expectedGraduationYear ? parseInt(formData.expectedGraduationYear) : new Date().getFullYear() + 2,
          studentIdNumber: formData.studentIdNumber,
          currentCGPA: formData.currentCGPA ? parseFloat(formData.currentCGPA) : undefined,
          
          // Guardian Details
          guardianName: formData.guardianName,
          guardianRelation: formData.guardianRelation,
          guardianOccupation: formData.guardianOccupation,
          guardianEmployer: formData.guardianEmployer,
          guardianDesignation: formData.guardianDesignation,
          guardianMonthlyIncome: formData.guardianMonthlyIncome ? parseFloat(formData.guardianMonthlyIncome) : 0,
          guardianAnnualIncome: formData.guardianAnnualIncome ? parseFloat(formData.guardianAnnualIncome) : 0,
          guardianContact: formData.guardianContact,
          guardianEmail: formData.guardianEmail,
          guardianAddress: formData.guardianAddress,
          guardianCity: formData.guardianCity,
          guardianState: formData.guardianState,
          guardianPincode: formData.guardianPincode,
          guardianPanNumber: formData.guardianPanNumber,
          guardianAadharNumber: formData.guardianAadharNumber,
          
          // Financial Support
          scholarshipAmount: formData.scholarshipAmount ? parseFloat(formData.scholarshipAmount) : undefined,
          scholarshipProvider: formData.scholarshipProvider,
          familySavingsForEducation: formData.familySavingsForEducation ? parseFloat(formData.familySavingsForEducation) : undefined,
          additionalFinancialSupport: formData.additionalFinancialSupport
        };
        break;
        
      default:
        // SALARIED, SELF_EMPLOYED, BUSINESS_OWNER, UNEMPLOYED don't need specialized details
        break;
    }
  }
}
