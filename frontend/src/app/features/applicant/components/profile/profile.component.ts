import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';

interface PersonalDetails {
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  fatherName: string;
  motherName: string;
  panNumber: string;
  aadhaarNumber: string;
  currentAddressLine1: string;
  currentAddressLine2?: string;
  currentCity: string;
  currentState: string;
  currentPincode: string;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentPincode?: string;
  sameAsCurrent: boolean;
  alternatePhoneNumber?: string;
  dependentsCount?: number;
  spouseName?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);

  // State management
  isLoading = signal(false);
  isEditing = signal(false);
  personalDetails = signal<PersonalDetails | null>(null);
  profileForm!: FormGroup;

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
    this.loadPersonalDetails();
  }

  /**
   * Initialize the reactive form
   */
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      // Personal Information
      firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      middleName: ['', [Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      maritalStatus: ['', [Validators.required]],
      fatherName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      motherName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      
      // Identity Information
      panNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      aadhaarNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{12}$/)]],
      
      // Current Address
      currentAddressLine1: ['', [Validators.required, Validators.maxLength(200)]],
      currentAddressLine2: ['', [Validators.maxLength(200)]],
      currentCity: ['', [Validators.required, Validators.maxLength(100)]],
      currentState: ['', [Validators.required]],
      currentPincode: ['', [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)]],
      
      // Permanent Address
      sameAsCurrent: [false],
      permanentAddressLine1: ['', [Validators.maxLength(200)]],
      permanentAddressLine2: ['', [Validators.maxLength(200)]],
      permanentCity: ['', [Validators.maxLength(100)]],
      permanentState: [''],
      permanentPincode: ['', [Validators.pattern(/^[1-9][0-9]{5}$/)]],
      
      // Optional Fields
      alternatePhoneNumber: ['', [Validators.pattern(/^[6-9]\d{9}$/)]],
      dependentsCount: [0, [Validators.min(0), Validators.max(20)]],
      spouseName: ['', [Validators.maxLength(100)]]
    });

    // Disable form initially (view mode)
    this.profileForm.disable();

    // Watch for same as current address changes
    this.profileForm.get('sameAsCurrent')?.valueChanges.subscribe(sameAsCurrent => {
      this.togglePermanentAddressFields(!sameAsCurrent);
    });

    // Watch for marital status changes
    this.profileForm.get('maritalStatus')?.valueChanges.subscribe(status => {
      const spouseNameControl = this.profileForm.get('spouseName');
      if (status === 'MARRIED') {
        spouseNameControl?.setValidators([Validators.required, Validators.maxLength(100)]);
      } else {
        spouseNameControl?.clearValidators();
        spouseNameControl?.setValue('');
      }
      spouseNameControl?.updateValueAndValidity();
    });
  }

  /**
   * Load personal details from backend
   */
  private loadPersonalDetails(): void {
    this.isLoading.set(true);
    
    this.userProfileService.getPersonalDetails().subscribe({
      next: (response) => {
        console.log('✅ Personal details loaded:', response);
        this.isLoading.set(false);
        
        // Check if response contains actual personal details data
        if (response && typeof response === 'object') {
          const responseData = response as any;
          
          // Check if this response has personal details fields (firstName indicates data is present)
          if (responseData.firstName && responseData.lastName) {
            // Response contains actual personal details data - populate the form
            this.populateFormWithData(responseData);
            this.notificationService.success('Success', 'Personal details loaded successfully!');
          } else if (responseData.message) {
            // Response contains only status message
            if (responseData.message.includes('found successfully')) {
              this.notificationService.info('Info', 'Personal details found but data structure needs update.');
            } else {
              this.notificationService.info('Info', responseData.message || 'Please complete your profile.');
            }
          } else {
            this.notificationService.info('Info', 'Please complete your profile.');
          }
        } else {
          this.notificationService.info('Info', 'Please complete your profile.');
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.log('No existing personal details found:', error);
        
        if (error.status === 404) {
          this.notificationService.info('Profile Setup', 'No personal details found. Please complete your profile.');
        } else {
          this.notificationService.warning('Error', 'Failed to load personal details. Please try again.');
        }
      }
    });
  }

  /**
   * Populate form with loaded data
   */
  private populateFormWithData(data: any): void {
    if (!data) return;
    
    console.log('🔄 Populating form with data:', data);
    
    // Format date for HTML input (YYYY-MM-DD)
    let formattedDate = '';
    if (data.dateOfBirth) {
      if (typeof data.dateOfBirth === 'string') {
        // Handle string dates (YYYY-MM-DD or other formats)
        formattedDate = data.dateOfBirth.split('T')[0]; // Remove time part if present
      } else if (data.dateOfBirth instanceof Date) {
        // Handle Date objects
        formattedDate = data.dateOfBirth.toISOString().split('T')[0];
      }
    }
    
    this.profileForm.patchValue({
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      middleName: data.middleName || '',
      dateOfBirth: formattedDate,
      gender: data.gender || '',
      maritalStatus: data.maritalStatus || '',
      fatherName: data.fatherName || '',
      motherName: data.motherName || '',
      panNumber: data.panNumber || '',
      aadhaarNumber: data.aadhaarNumber || '',
      currentAddressLine1: data.currentAddressLine1 || '',
      currentAddressLine2: data.currentAddressLine2 || '',
      currentCity: data.currentCity || '',
      currentState: data.currentState || '',
      currentPincode: data.currentPincode || '',
      sameAsCurrent: data.sameAsCurrent || false,
      permanentAddressLine1: data.permanentAddressLine1 || '',
      permanentAddressLine2: data.permanentAddressLine2 || '',
      permanentCity: data.permanentCity || '',
      permanentState: data.permanentState || '',
      permanentPincode: data.permanentPincode || '',
      alternatePhoneNumber: data.alternatePhoneNumber || '',
      dependentsCount: data.dependentsCount || 0,
      spouseName: data.spouseName || ''
    });
    
    console.log('✅ Form populated successfully');
  }

  /**
   * Toggle between view and edit mode
   */
  toggleEditMode(): void {
    const editing = !this.isEditing();
    this.isEditing.set(editing);
    
    if (editing) {
      this.profileForm.enable();
      this.notificationService.info('Edit Mode', 'You can now edit your profile details.');
    } else {
      this.profileForm.disable();
      // Reset form to original values if cancelled
      this.loadPersonalDetails();
    }
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      this.notificationService.warning('Validation Error', 'Please fill all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formData = this.profileForm.value;
    
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
      // Current Address
      currentAddressLine1: formData.currentAddressLine1.trim(),
      currentAddressLine2: formData.currentAddressLine2?.trim() || null,
      currentCity: formData.currentCity.trim(),
      currentState: formData.currentState,
      currentPincode: formData.currentPincode,
      // Permanent Address
      sameAsCurrent: formData.sameAsCurrent,
      permanentAddressLine1: formData.sameAsCurrent ? formData.currentAddressLine1.trim() : (formData.permanentAddressLine1?.trim() || null),
      permanentAddressLine2: formData.sameAsCurrent ? (formData.currentAddressLine2?.trim() || null) : (formData.permanentAddressLine2?.trim() || null),
      permanentCity: formData.sameAsCurrent ? formData.currentCity.trim() : (formData.permanentCity?.trim() || null),
      permanentState: formData.sameAsCurrent ? formData.currentState : (formData.permanentState || null),
      permanentPincode: formData.sameAsCurrent ? formData.currentPincode : (formData.permanentPincode || null),
      // Optional fields
      alternatePhoneNumber: formData.alternatePhoneNumber?.trim() || null,
      dependentsCount: formData.dependentsCount || 0,
      spouseName: formData.spouseName?.trim() || null
    };

    console.log('🚀 Sending personal details request:', personalDetailsRequest);
    
    this.userProfileService.savePersonalDetailsNew(personalDetailsRequest).subscribe({
      next: (response) => {
        console.log('✅ Profile saved successfully:', response);
        this.isLoading.set(false);
        this.isEditing.set(false);
        this.profileForm.disable();
        this.notificationService.success('Success', 'Profile updated successfully!');
        
        // Reload the data
        this.loadPersonalDetails();
      },
      error: (error) => {
        console.error('❌ Failed to save profile:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          message: error.message,
          error: error.error
        });
        
        this.isLoading.set(false);
        
        let errorMessage = 'Failed to save profile. Please try again.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 400) {
          errorMessage = 'Invalid data provided. Please check all fields.';
        } else if (error.status === 401) {
          errorMessage = 'You are not authorized. Please login again.';
        } else if (error.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Cancel editing
   */
  cancelEdit(): void {
    this.isEditing.set(false);
    this.profileForm.disable();
    this.loadPersonalDetails();
    this.notificationService.info('Cancelled', 'Changes cancelled.');
  }

  /**
   * Navigate to complete personal details form
   */
  completeProfile(): void {
    this.router.navigate(['/applicant/profile']);
  }

  /**
   * Toggle permanent address fields based on same as current
   */
  private togglePermanentAddressFields(enable: boolean): void {
    const permanentFields = ['permanentAddressLine1', 'permanentAddressLine2', 'permanentCity', 'permanentState', 'permanentPincode'];
    
    permanentFields.forEach(field => {
      const control = this.profileForm.get(field);
      if (enable && this.isEditing()) {
        control?.enable();
      } else {
        control?.disable();
        if (!enable) {
          control?.setValue('');
        }
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
  getFieldError(fieldName: string): string {
    const control = this.profileForm.get(fieldName);
    
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
   * Format PAN number input
   */
  onPanInput(event: any): void {
    if (this.isEditing()) {
      const value = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      this.profileForm.get('panNumber')?.setValue(value);
    }
  }

  /**
   * Format Aadhaar number input
   */
  onAadhaarInput(event: any): void {
    if (this.isEditing()) {
      const value = event.target.value.replace(/[^0-9]/g, '');
      this.profileForm.get('aadhaarNumber')?.setValue(value);
    }
  }

  /**
   * Format phone number input
   */
  onPhoneInput(event: any, fieldName: string): void {
    if (this.isEditing()) {
      const value = event.target.value.replace(/[^0-9]/g, '');
      this.profileForm.get(fieldName)?.setValue(value);
    }
  }
}
