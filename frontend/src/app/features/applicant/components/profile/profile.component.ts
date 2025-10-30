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
  personalDetails = signal<PersonalDetails | null>(null);

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
    const option = this.genderOptions.find(opt => opt.value === gender);
    return option ? option.label : gender;
  }

  /**
   * Get display value for marital status
   */
  getMaritalStatusDisplay(status: string): string {
    const option = this.maritalStatusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }
}
