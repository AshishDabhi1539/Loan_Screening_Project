import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

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
  profilePhotoUrl?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);
  private fb = inject(FormBuilder);

  // State management
  isLoading = signal(true);
  isUploading = signal(false);
  personalDetails = signal<PersonalDetails | null>(null);
  
  // Password reset modal
  showPasswordModal = signal(false);
  isChangingPassword = signal(false);
  isSendingOtp = signal(false);
  isOtpSent = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  
  passwordForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  currentUser = this.authService.currentUser;
  userEmail = computed(() => this.currentUser()?.email || 'N/A');
  userRole = computed(() => this.authService.userRole());

  applicantName = computed(() => {
    const details = this.personalDetails();
    if (details?.firstName || details?.lastName) {
      return `${details.firstName || ''} ${details.middleName || ''} ${details.lastName || ''}`.trim();
    }
    return this.currentUser()?.email?.split('@')[0] || 'Applicant';
  });

  profilePhotoUrl = computed(() => {
    return this.personalDetails()?.profilePhotoUrl || null;
  });

  applicantInitials = computed(() => {
    const name = this.applicantName();
    if (name && name.length > 0) {
      const parts = name.trim().split(' ').filter(p => p.length > 0);
      if (parts.length >= 2) {
        return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
      }
      return name.charAt(0).toUpperCase();
    }
    return 'A';
  });

  ngOnInit(): void {
    this.loadPersonalDetails();
  }

  /**
   * Load personal details from backend
   * Auto-redirects to personal-details form if no data found
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
            // ✅ Data exists - show profile
            this.personalDetails.set(responseData);
            console.log('✅ Profile data set:', this.personalDetails());
          } else {
            // ❌ No proper data - redirect to personal details form
            this.notificationService.info(
              'Complete Profile Required', 
              'Please fill your personal details to view your profile.'
            );
            this.router.navigate(['/applicant/personal-details']);
          }
        } else {
          // ❌ Invalid response - redirect
          this.notificationService.info(
            'Profile Setup Required', 
            'Please complete your profile to continue.'
          );
          this.router.navigate(['/applicant/personal-details']);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        console.log('No existing personal details found:', error);
        
        // ❌ No data found - redirect to personal details form
        if (error.status === 404) {
          this.notificationService.info(
            'Profile Setup Required', 
            'Complete your personal details to access your profile.'
          );
        } else {
          this.notificationService.warning(
            'Error', 
            'Failed to load profile. Redirecting to complete your details.'
          );
        }
        this.router.navigate(['/applicant/personal-details']);
      }
    });
  }

  /**
   * Navigate to personal details form for editing
   */
  editProfile(): void {
    this.router.navigate(['/applicant/personal-details']);
  }

  /**
   * Handle file selection for profile photo
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.notificationService.error('Invalid File', 'Please select an image file');
        return;
      }
      
      // Validate file size (2MB max)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        this.notificationService.error('File Too Large', 'Profile photo must be less than 2MB');
        return;
      }
      
      this.uploadPhoto(file);
    }
  }

  /**
   * Upload profile photo
   */
  uploadPhoto(file: File): void {
    this.isUploading.set(true);
    this.userProfileService.uploadProfilePhoto(file).subscribe({
      next: (photoUrl) => {
        // Update profile with new photo URL
        const currentDetails = this.personalDetails();
        if (currentDetails) {
          currentDetails.profilePhotoUrl = photoUrl;
          this.personalDetails.set({ ...currentDetails });
        }
        this.isUploading.set(false);
        this.notificationService.success('Success', 'Profile photo uploaded successfully');
      },
      error: (error) => {
        this.isUploading.set(false);
        this.notificationService.error('Upload Failed', error.message || 'Failed to upload profile photo');
      }
    });
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('profile-photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return 'N/A';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  /**
   * Get display value for gender
   */
  getGenderDisplay(gender: string): string {
    const options = [
      { value: 'MALE', label: 'Male' },
      { value: 'FEMALE', label: 'Female' },
      { value: 'OTHER', label: 'Other' }
    ];
    const option = options.find(opt => opt.value === gender);
    return option ? option.label : gender;
  }

  /**
   * Get display value for marital status
   */
  getMaritalStatusDisplay(status: string): string {
    const options = [
      { value: 'SINGLE', label: 'Single' },
      { value: 'MARRIED', label: 'Married' },
      { value: 'DIVORCED', label: 'Divorced' },
      { value: 'WIDOWED', label: 'Widowed' }
    ];
    const option = options.find(opt => opt.value === status);
    return option ? option.label : status;
  }

  /**
   * Password match validator
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  /**
   * Open password reset modal - show email confirmation step
   */
  openPasswordModal(): void {
    this.showPasswordModal.set(true);
    this.passwordForm.reset();
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
    this.isOtpSent.set(false);
    this.isSendingOtp.set(false);
  }

  /**
   * Send OTP to user's email
   */
  sendOtp(): void {
    const email = this.userEmail();
    if (!email || email === 'N/A') {
      this.notificationService.error('Error', 'User email not found');
      return;
    }

    this.isSendingOtp.set(true);
    this.authService.forgotPassword(email).subscribe({
      next: () => {
        this.isSendingOtp.set(false);
        this.isOtpSent.set(true);
        this.notificationService.success('OTP Sent', 'Please check your email for the OTP code');
      },
      error: (error: any) => {
        this.isSendingOtp.set(false);
        const errorMessage = error.error?.message || error.message || 'Failed to send OTP';
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Close password reset modal
   */
  closePasswordModal(): void {
    this.showPasswordModal.set(false);
    this.passwordForm.reset();
    this.isOtpSent.set(false);
    this.isSendingOtp.set(false);
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'new' | 'confirm'): void {
    if (field === 'new') {
      this.showNewPassword.update((v: boolean) => !v);
    } else {
      this.showConfirmPassword.update((v: boolean) => !v);
    }
  }

  /**
   * Submit password reset with OTP
   */
  onPasswordSubmit(): void {
    if (this.passwordForm.invalid) {
      Object.keys(this.passwordForm.controls).forEach(key => {
        this.passwordForm.get(key)?.markAsTouched();
      });
      return;
    }

    const { otp, newPassword, confirmPassword } = this.passwordForm.value;
    const email = this.userEmail();
    
    if (!email || email === 'N/A') {
      this.notificationService.error('Error', 'User email not found');
      return;
    }
    
    this.isChangingPassword.set(true);
    this.authService.resetPassword(email, otp, newPassword, confirmPassword).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.notificationService.success('Success', 'Password reset successfully. Please login with your new password.');
        this.closePasswordModal();
        
        // Logout user after password reset
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
      },
      error: (error: any) => {
        this.isChangingPassword.set(false);
        const errorMessage = error.error?.message || error.message || 'Failed to reset password';
        this.notificationService.error('Error', errorMessage);
      }
    });
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string, errorType?: string): boolean {
    const field = this.passwordForm.get(fieldName);
    if (!field) return false;
    
    if (errorType) {
      return field.hasError(errorType) && (field.dirty || field.touched);
    }
    return field.invalid && (field.dirty || field.touched);
  }

  /**
   * Check if passwords match
   */
  get passwordsMatch(): boolean {
    return !this.passwordForm.hasError('passwordMismatch');
  }
}
