import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileService, PersonalDetailsRequest, AddressRequest } from '../../../../core/services/user-profile.service';

@Component({
  selector: 'app-personal-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personal-details.component.html',
  styleUrl: './personal-details.component.css'
})
export class PersonalDetailsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);

  // Form and state management
  personalDetailsForm!: FormGroup;
  isLoading = signal(false);
  currentStep = signal(1);
  totalSteps = 3;

  // Form validation patterns
  readonly patterns = {
    pan: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
    aadhaar: /^[0-9]{12}$/,
    phone: /^[6-9]\d{9}$/,
    pincode: /^[1-9][0-9]{5}$/
  };

  // Dropdown options
  readonly genderOptions = [
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' }
  ];

  readonly maritalStatusOptions = [
    { value: 'SINGLE', label: 'Single' },
    { value: 'MARRIED', label: 'Married' },
    { value: 'DIVORCED', label: 'Divorced' },
    { value: 'WIDOWED', label: 'Widowed' }
  ];

  readonly stateOptions = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Lakshadweep', 'Puducherry', 'Andaman and Nicobar Islands'
  ];

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingData();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.personalDetailsForm = this.fb.group({
      // Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      maritalStatus: ['', [Validators.required]],
      
      // Parent Information - REQUIRED by backend
      fatherName: ['', [Validators.required, Validators.maxLength(100)]],
      motherName: ['', [Validators.required, Validators.maxLength(100)]],

      // Identity Information
      panNumber: ['', [Validators.required, Validators.pattern(this.patterns.pan)]],
      aadhaarNumber: ['', [Validators.required, Validators.pattern(this.patterns.aadhaar)]],

      // Current Address - Flat structure to match backend
      currentAddressLine1: ['', [Validators.required, Validators.maxLength(100)]],
      currentAddressLine2: ['', [Validators.maxLength(100)]],
      currentCity: ['', [Validators.required, Validators.maxLength(50)]],
      currentState: ['', [Validators.required]],
      currentPincode: ['', [Validators.required, Validators.pattern(this.patterns.pincode)]],

      // Permanent Address - Flat structure to match backend
      sameAsCurrent: [false],
      permanentAddressLine1: ['', [Validators.maxLength(100)]],
      permanentAddressLine2: ['', [Validators.maxLength(100)]],
      permanentCity: ['', [Validators.maxLength(50)]],
      permanentState: [''],
      permanentPincode: ['', [Validators.pattern(this.patterns.pincode)]],
      
      // Additional Optional Fields
      alternatePhoneNumber: ['', [Validators.pattern(this.patterns.phone)]],
      dependentsCount: [0, [Validators.min(0), Validators.max(20)]],
      spouseName: ['', [Validators.maxLength(100)]]
    });

    // Watch for marital status changes to conditionally require spouse name
    this.personalDetailsForm.get('maritalStatus')?.valueChanges.subscribe(maritalStatus => {
      const spouseNameControl = this.personalDetailsForm.get('spouseName');
      if (maritalStatus === 'MARRIED') {
        spouseNameControl?.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        spouseNameControl?.setValidators([Validators.maxLength(100)]);
        spouseNameControl?.setValue(''); // Clear spouse name if not married
      }
      spouseNameControl?.updateValueAndValidity();
    });

    // Watch for same as current address changes
    this.personalDetailsForm.get('sameAsCurrent')?.valueChanges.subscribe(sameAsCurrent => {
      if (sameAsCurrent) {
        // Copy current address to permanent address
        const currentAddressLine1 = this.personalDetailsForm.get('currentAddressLine1')?.value;
        const currentAddressLine2 = this.personalDetailsForm.get('currentAddressLine2')?.value;
        const currentCity = this.personalDetailsForm.get('currentCity')?.value;
        const currentState = this.personalDetailsForm.get('currentState')?.value;
        const currentPincode = this.personalDetailsForm.get('currentPincode')?.value;
        
        this.personalDetailsForm.patchValue({
          permanentAddressLine1: currentAddressLine1,
          permanentAddressLine2: currentAddressLine2,
          permanentCity: currentCity,
          permanentState: currentState,
          permanentPincode: currentPincode
        });
        
        // Disable permanent address fields
        this.personalDetailsForm.get('permanentAddressLine1')?.disable();
        this.personalDetailsForm.get('permanentAddressLine2')?.disable();
        this.personalDetailsForm.get('permanentCity')?.disable();
        this.personalDetailsForm.get('permanentState')?.disable();
        this.personalDetailsForm.get('permanentPincode')?.disable();
      } else {
        // Enable permanent address fields
        this.personalDetailsForm.get('permanentAddressLine1')?.enable();
        this.personalDetailsForm.get('permanentAddressLine2')?.enable();
        this.personalDetailsForm.get('permanentCity')?.enable();
        this.personalDetailsForm.get('permanentState')?.enable();
        this.personalDetailsForm.get('permanentPincode')?.enable();
        
        // Clear permanent address fields
        this.personalDetailsForm.patchValue({
          permanentAddressLine1: '',
          permanentAddressLine2: [''],
          permanentCity: [''],
          permanentState: [''],
          permanentPincode: [''],
          alternatePhoneNumber: [''],
          dependentsCount: [0, [Validators.min(0), Validators.max(20)]],
          spouseName: ['']
        });
      }
    });
  }

  /**
   * Check if user already has personal details
   */
  private checkExistingData(): void {
    this.isLoading.set(true);
    
    this.userProfileService.getPersonalDetails().subscribe({
      next: (details) => {
        this.populateForm(details);
        this.isLoading.set(false);
      },
      error: (error) => {
        // No existing data, continue with empty form
        console.log('No existing personal details found');
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Populate form with existing data
   */
  private populateForm(details: any): void {
    this.personalDetailsForm.patchValue({
      firstName: details.firstName,
      lastName: details.lastName,
      middleName: details.middleName,
      dateOfBirth: details.dateOfBirth ? new Date(details.dateOfBirth).toISOString().split('T')[0] : '',
      gender: details.gender,
      maritalStatus: details.maritalStatus,
      phoneNumber: details.phoneNumber,
      alternatePhoneNumber: details.alternatePhoneNumber,
      panNumber: details.panNumber,
      aadhaarNumber: details.aadhaarNumber,
      currentAddress: details.currentAddress,
      sameAsPermanent: details.permanentAddress ? 
        JSON.stringify(details.currentAddress) === JSON.stringify(details.permanentAddress) : false,
      permanentAddress: details.permanentAddress || { country: 'India' }
    });
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    return Math.round((this.currentStep() / this.totalSteps) * 100);
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
      case 1: // Personal Information
        const isBasicInfoValid = !!(this.personalDetailsForm.get('firstName')?.valid &&
               this.personalDetailsForm.get('lastName')?.valid &&
               this.personalDetailsForm.get('dateOfBirth')?.valid &&
               this.personalDetailsForm.get('gender')?.valid &&
               this.personalDetailsForm.get('maritalStatus')?.valid &&
               this.personalDetailsForm.get('fatherName')?.valid &&
               this.personalDetailsForm.get('motherName')?.valid &&
               this.personalDetailsForm.get('dependentsCount')?.valid &&
               this.personalDetailsForm.get('alternatePhoneNumber')?.valid);
        
        // Check spouse name if married
        const maritalStatus = this.personalDetailsForm.get('maritalStatus')?.value;
        if (maritalStatus === 'MARRIED') {
          return isBasicInfoValid && !!(this.personalDetailsForm.get('spouseName')?.valid);
        }
        
        return isBasicInfoValid;
      
      case 2: // Identity Information
        return !!(this.personalDetailsForm.get('panNumber')?.valid &&
               this.personalDetailsForm.get('aadhaarNumber')?.valid);
      
      case 3: // Address Information (both current and permanent)
        const currentAddressValid = !!(this.personalDetailsForm.get('currentAddressLine1')?.valid &&
               this.personalDetailsForm.get('currentCity')?.valid &&
               this.personalDetailsForm.get('currentState')?.valid &&
               this.personalDetailsForm.get('currentPincode')?.valid);
        
        const sameAsCurrent = this.personalDetailsForm.get('sameAsCurrent')?.value;
        if (sameAsCurrent) {
          return currentAddressValid; // If same as current, only current address needs to be valid
        }
        
        // If permanent address is different, validate permanent address fields too
        const permanentAddressValid = !!(this.personalDetailsForm.get('permanentAddressLine1')?.valid &&
               this.personalDetailsForm.get('permanentCity')?.valid &&
               this.personalDetailsForm.get('permanentState')?.valid &&
               this.personalDetailsForm.get('permanentPincode')?.valid);
        
        return currentAddressValid && permanentAddressValid;
      
      default:
        return false;
    }
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.personalDetailsForm.invalid) {
      this.markFormGroupTouched(this.personalDetailsForm);
      this.notificationService.warning('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formData = this.personalDetailsForm.value;
    
    const personalDetailsRequest = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      middleName: formData.middleName?.trim() || null,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      maritalStatus: formData.maritalStatus,
      fatherName: formData.fatherName.trim(),
      motherName: formData.motherName.trim(),
      panNumber: formData.panNumber.toUpperCase(),
      aadhaarNumber: formData.aadhaarNumber,
      // Current Address - flat structure
      currentAddressLine1: formData.currentAddressLine1.trim(),
      currentAddressLine2: formData.currentAddressLine2?.trim() || null,
      currentCity: formData.currentCity.trim(),
      currentState: formData.currentState,
      currentPincode: formData.currentPincode,
      // Permanent Address - flat structure
      sameAsCurrent: formData.sameAsCurrent,
      permanentAddressLine1: formData.sameAsCurrent ? formData.currentAddressLine1.trim() : (formData.permanentAddressLine1?.trim() || null),
      permanentAddressLine2: formData.sameAsCurrent ? (formData.currentAddressLine2?.trim() || null) : (formData.permanentAddressLine2?.trim() || null),
      permanentCity: formData.sameAsCurrent ? formData.currentCity.trim() : (formData.permanentCity?.trim() || null),
      permanentState: formData.sameAsCurrent ? formData.currentState : (formData.permanentState || null),
      permanentPincode: formData.sameAsCurrent ? formData.currentPincode : (formData.permanentPincode || null),
      
      // Additional optional fields
      alternatePhoneNumber: formData.alternatePhoneNumber?.trim() || null,
      dependentsCount: formData.dependentsCount || 0,
      spouseName: formData.spouseName?.trim() || null
    };

    // Submit to backend using direct API call
    this.userProfileService.savePersonalDetailsNew(personalDetailsRequest).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.notificationService.success('Success', 'Personal details saved successfully!');
        
        // Navigate back to dashboard
        this.router.navigate(['/applicant/dashboard']);
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error('Failed to save personal details:', error);
        
        let errorMessage = 'Failed to save personal details. Please try again.';
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

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string, parentGroup?: string): string {
    const control = this.personalDetailsForm.get(fieldName);
    
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (control.errors['minlength']) return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      if (control.errors['maxlength']) return `${this.getFieldLabel(fieldName)} must not exceed ${control.errors['maxlength'].requiredLength} characters`;
      if (control.errors['pattern']) return `${this.getFieldLabel(fieldName)} format is invalid`;
    }
    return '';
  }

  /**
   * Get user-friendly field label
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      firstName: 'First Name',
      lastName: 'Last Name',
      middleName: 'Middle Name',
      fatherName: "Father's Name",
      motherName: "Mother's Name",
      dateOfBirth: 'Date of Birth',
      gender: 'Gender',
      maritalStatus: 'Marital Status',
      panNumber: 'PAN Number',
      aadhaarNumber: 'Aadhaar Number',
      currentAddressLine1: 'Current Address Line 1',
      currentAddressLine2: 'Current Address Line 2',
      currentCity: 'Current City',
      currentState: 'Current State',
      currentPincode: 'Current PIN Code',
      permanentAddressLine1: 'Permanent Address Line 1',
      permanentAddressLine2: 'Permanent Address Line 2',
      permanentCity: 'Permanent City',
      permanentState: 'Permanent State',
      permanentPincode: 'Permanent PIN Code',
      alternatePhoneNumber: 'Alternate Phone Number',
      dependentsCount: 'Number of Dependents',
      spouseName: "Spouse's Name"
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Cancel and go back to dashboard
   */
  cancel(): void {
    this.router.navigate(['/applicant/dashboard']);
  }

  /**
   * Format PAN number input
   */
  onPanInput(event: any): void {
    const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    this.personalDetailsForm.get('panNumber')?.setValue(value);
  }

  /**
   * Format Aadhaar number input
   */
  onAadhaarInput(event: any): void {
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.personalDetailsForm.get('aadhaarNumber')?.setValue(value);
  }

  /**
   * Format phone number input
   */
  onPhoneInput(event: any, fieldName: string): void {
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.personalDetailsForm.get(fieldName)?.setValue(value);
  }

}
