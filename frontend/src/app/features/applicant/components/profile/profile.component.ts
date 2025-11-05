import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

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
  imports: [CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private userProfileService = inject(UserProfileService);

  // State management
  isLoading = signal(true);
  isUploading = signal(false);
  personalDetails = signal<PersonalDetails | null>(null);

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
}
