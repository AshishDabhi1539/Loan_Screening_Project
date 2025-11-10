import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { PersonalDetailsRequest, AddressRequest } from '../../../../core/models/user.model';

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
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);

  // Form and state management
  personalDetailsForm!: FormGroup;
  isLoading = signal(false);
  isEditMode = signal(false); // Track if user is editing existing data
  returnUrl = signal<string>(''); // URL to return to after completion
  applicationId = signal<string>(''); // Application ID if provided
  
  // Fields that cannot be edited in edit mode (as per real-world regulations)
  readonly nonEditableFields = [
    'panNumber',        // PAN cannot be changed
    'aadhaarNumber',    // Aadhaar cannot be changed
    'dateOfBirth'       // Date of birth cannot be changed
  ];

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
    // Get query parameters
    this.returnUrl.set(this.route.snapshot.queryParams['returnUrl'] || '');
    this.applicationId.set(this.route.snapshot.queryParams['applicationId'] || '');
    
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
      dateOfBirth: ['', [Validators.required, this.minAgeValidator(18)]],
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
      const permAddrLine1 = this.personalDetailsForm.get('permanentAddressLine1');
      const permAddrLine2 = this.personalDetailsForm.get('permanentAddressLine2');
      const permCity = this.personalDetailsForm.get('permanentCity');
      const permState = this.personalDetailsForm.get('permanentState');
      const permPincode = this.personalDetailsForm.get('permanentPincode');
      
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
        
        // Remove validators and clear errors when same as current
        permAddrLine1?.clearValidators();
        permCity?.clearValidators();
        permState?.clearValidators();
        permPincode?.clearValidators();
        
        permAddrLine1?.updateValueAndValidity();
        permCity?.updateValueAndValidity();
        permState?.updateValueAndValidity();
        permPincode?.updateValueAndValidity();
      } else {
        // Add validators when permanent address is different
        permAddrLine1?.setValidators([Validators.required, Validators.maxLength(100)]);
        permCity?.setValidators([Validators.required, Validators.maxLength(50)]);
        permState?.setValidators([Validators.required]);
        permPincode?.setValidators([Validators.required, Validators.pattern(this.patterns.pincode)]);
        
        permAddrLine1?.updateValueAndValidity();
        permCity?.updateValueAndValidity();
        permState?.updateValueAndValidity();
        permPincode?.updateValueAndValidity();
        
        // Clear permanent address fields
        this.personalDetailsForm.patchValue({
          permanentAddressLine1: '',
          permanentAddressLine2: '',
          permanentCity: '',
          permanentState: '',
          permanentPincode: ''
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
        if (details && details.firstName) {
          // Data exists - this is EDIT mode
          this.isEditMode.set(true);
          this.populateForm(details);
          this.disableNonEditableFields();
          console.log('✅ Edit mode - data loaded for editing');
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        // No existing data - this is CREATE mode
        this.isEditMode.set(false);
        console.log('✅ Create mode - no existing data');
        this.isLoading.set(false);
      }
    });
  }
  
  /**
   * Disable fields that cannot be edited in edit mode
   */
  private disableNonEditableFields(): void {
    this.nonEditableFields.forEach(fieldName => {
      this.personalDetailsForm.get(fieldName)?.disable();
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
   * Submit the form
   */
  onSubmit(): void {
    if (this.personalDetailsForm.invalid) {
      this.markFormGroupTouched(this.personalDetailsForm);
      this.notificationService.warning('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    // Use getRawValue() to include disabled fields (PAN, Aadhaar, DOB in edit mode)
    const formData = this.personalDetailsForm.getRawValue();
    
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
        
        // Check if we have a return URL (coming from summary page)
        const returnUrl = this.returnUrl();
        if (returnUrl) {
          this.notificationService.success('Success', 'Personal details updated successfully!');
          this.router.navigateByUrl(returnUrl);
        } else if (this.isEditMode()) {
          // EDIT mode - return to profile
          this.notificationService.success('Success', 'Profile updated successfully!');
          this.router.navigate(['/applicant/profile']);
        } else {
          // CREATE mode - return to dashboard
          this.notificationService.success('Success', 'Personal details saved successfully!');
          this.router.navigate(['/applicant/dashboard']);
        }
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
   * Validator to ensure user is at least the specified minimum age
   */
  private minAgeValidator(minAge: number): ValidatorFn {
    return (control: AbstractControl) => {
      const value = control.value;
      if (!value) {
        return null;
      }

      const dob = new Date(value);
      if (isNaN(dob.getTime())) {
        return { invalidDate: true };
      }

      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      return age >= minAge ? null : { minAge: { requiredAge: minAge, actualAge: age } };
    };
  }
  
  /**
   * Check if a field is editable
   */
  isFieldEditable(fieldName: string): boolean {
    if (!this.isEditMode()) return true; // All fields editable in create mode
    return !this.nonEditableFields.includes(fieldName);
  }
  
  /**
   * Get field error message
   */
  getFieldError(fieldName: string): string {
    const control = this.personalDetailsForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'This field is required';
      if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
      if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters allowed`;
      if (control.errors['pattern']) {
        if (fieldName === 'panNumber') return 'Invalid PAN format (e.g., ABCDE1234F)';
        if (fieldName === 'aadhaarNumber') return 'Invalid Aadhaar format (12 digits)';
        if (fieldName === 'alternatePhoneNumber') return 'Invalid phone number (10 digits)';
        if (fieldName.includes('Pincode')) return 'Invalid PIN code (6 digits)';
        return 'Invalid format';
      }
      if (control.errors['minAge']) return 'Applicant must be at least 18 years old';
      if (control.errors['invalidDate']) return 'Invalid date selected';
      if (control.errors['min']) return `Minimum value is ${control.errors['min'].min}`;
      if (control.errors['max']) return `Maximum value is ${control.errors['max'].max}`;
    }
    return '';
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
